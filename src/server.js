require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const mongoSanitize = require('express-mongo-sanitize')
const cookieParser = require('cookie-parser')
const morgan = require('morgan')
const path = require("path");

const connectDB = require('./config/database')
const logger = require('./utils/logger')
const { apiLimiter } = require('./middleware/rateLimiter')
const { errorHandler, notFound } = require('./middleware/errorHandler')
const { startCleanupJobs } = require('./utils/cleanup')

const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/users')

const app = express()

require('dns').resolve('smtp.gmail.com', (err) => {
  console.log("DNS Test:", err ? "FAIL" : "OK");
});
// ── Security middleware ────────────────────────────────────────────────────────


app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https:"],
      },
    },
  })
);

app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:3001',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

app.use(compression())
app.use(cookieParser())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(mongoSanitize())

// ── Logging ────────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.http(msg.trim()) },
    skip: (req) => req.path === '/health',
  }))
}


// ── Trust proxy (for IP detection behind nginx/load balancer) ─────────────────
app.set('trust proxy', 1)

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use('/api/', apiLimiter)

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    service: 'SecureAuth API',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV,
  })
})

// ── API routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth',  authRoutes)
app.use('/api/users', userRoutes)



// Serve frontend (dist)


app.use(express.static(path.join(__dirname, "./dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../Frontend/dist/index.html"));
});


// ── API info ───────────────────────────────────────────────────────────────────
app.get('/api', (req, res) => {
  res.json({
    success: true,
    name: 'SecureAuth API',
    version: '2.0.0',
    endpoints: {
      auth: {
        'POST /api/auth/register':         'Register new user',
        'POST /api/auth/login':            'Login',
        'POST /api/auth/verify-email':     'Verify email OTP',
        'POST /api/auth/verify-2fa':       'Verify 2FA OTP',
        'POST /api/auth/forgot-password':  'Send password reset OTP',
        'POST /api/auth/verify-otp':       'Verify reset OTP → get reset token',
        'POST /api/auth/reset-password':   'Reset password',
        'POST /api/auth/resend-otp':       'Resend OTP',
        'POST /api/auth/refresh-token':    'Refresh access token',
        'POST /api/auth/logout':           'Logout (protected)',
      },
      users: {
        'GET  /api/users/me':                    'Get own profile',
        'PATCH /api/users/me':                   'Update profile',
        'POST /api/users/enable-2fa':            'Enable email OTP 2FA',
        'POST /api/users/disable-2fa':           'Disable email OTP 2FA',
        'POST /api/users/setup-totp':            'Setup TOTP (get QR code)',
        'POST /api/users/verify-totp':           'Verify TOTP token to enable',
        'POST /api/users/disable-totp':          'Disable TOTP',
        'POST /api/users/backup-codes':          'Generate backup codes',
        'POST /api/users/change-password':       'Change password from dashboard',
        'GET  /api/users/devices':               'Get known devices',
        'DELETE /api/users/devices/:id':         'Remove a device',
        'GET  /api/users/activity':              'Get activity log',
        'GET  /api/users/locker':                'Get locker items (no secrets)',
        'POST /api/users/locker':                'Add locker item',
        'GET  /api/users/locker/:id/secret':     'Decrypt locker secret',
        'PATCH /api/users/locker/:id':           'Update locker item',
        'DELETE /api/users/locker/:id':          'Delete locker item',
        'GET  /api/users/notifications':         'Get notifications',
        'PATCH /api/users/notifications/:id/read': 'Mark notification read',
        'DELETE /api/users/notifications/:id':  'Delete notification',
        'GET  /api/users/all':                   'Admin: get all users',
        'GET  /api/users/stats':                 'Admin: get stats',
        'DELETE /api/users/:id':                 'Admin: deactivate user',
        'PATCH /api/users/:id/reactivate':       'Admin: reactivate user',
        'PATCH /api/users/:id/role':             'Admin: update role',
      },
    },
  })
})

// ── 404 & Error handlers ───────────────────────────────────────────────────────
app.use(notFound)
app.use(errorHandler)

// ── Start server ───────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000

const start = async () => {
  await connectDB()
  startCleanupJobs()

  app.listen(PORT, () => {
    logger.info(`🚀 SecureAuth API running on port ${PORT} [${process.env.NODE_ENV}]`)
    logger.info(`📖 API docs: http://localhost:${PORT}/api`)
    logger.info(`❤️  Health:   http://localhost:${PORT}/health`)
  })
}

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err)
  process.exit(1)
})

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err)
  process.exit(1)
})

start()

module.exports = app
