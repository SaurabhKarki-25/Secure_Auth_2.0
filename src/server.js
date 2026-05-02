require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })

const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const mongoSanitize = require('express-mongo-sanitize')
const cookieParser = require('cookie-parser')
const morgan = require('morgan')
const path = require('path')

const connectDB = require('./config/database')
const logger = require('./utils/logger')
const { apiLimiter } = require('./middleware/rateLimiter')
const { errorHandler, notFound } = require('./middleware/errorHandler')
const { startCleanupJobs } = require('./utils/cleanup')

const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/users')

const app = express()

// ─────────────────────────────────────────
// SECURITY (FIXED CSP)
// ─────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com"
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com"
        ],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'"
        ],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: [
          "'self'",
          "https:"
        ]
      }
    }
  })
)

// ─────────────────────────────────────────
// CORS (FIXED)
// ─────────────────────────────────────────
app.use(cors({
  origin: true,
  credentials: true
}))

app.use(compression())
app.use(cookieParser())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(mongoSanitize())

// ─────────────────────────────────────────
// LOGGING
// ─────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.http(msg.trim()) },
    skip: (req) => req.path === '/health',
  }))
}

// ─────────────────────────────────────────
// API ROUTES FIRST (IMPORTANT)
// ─────────────────────────────────────────
app.use('/api/', apiLimiter)
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)

// ─────────────────────────────────────────
// HEALTH
// ─────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

// ─────────────────────────────────────────
// FRONTEND SERVE (FIXED ORDER)
// ─────────────────────────────────────────
const distPath = path.join(__dirname, "../Frontend/dist")

app.use(express.static(distPath))

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

// ─────────────────────────────────────────
// ERROR HANDLING
// ─────────────────────────────────────────
app.use(notFound)
app.use(errorHandler)

// ─────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────
const PORT = process.env.PORT || 5000

const start = async () => {
  await connectDB()
  startCleanupJobs()

  app.listen(PORT, () => {
    logger.info(`🚀 Server running on ${PORT}`)
  })
}

start()