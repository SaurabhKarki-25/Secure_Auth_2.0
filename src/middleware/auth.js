const { verifyAccessToken } = require('../utils/tokenUtils')
const { error } = require('../utils/response')
const User = require('../models/User')
const logger = require('../utils/logger')

// ── Authenticate JWT ───────────────────────────────────────────────────────────
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 'No token provided', 401)
    }

    const token = authHeader.split(' ')[1]
    let decoded

    try {
      decoded = verifyAccessToken(token)
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return error(res, 'Token expired', 401, null)
          && res.json({ success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' })
      }
      return error(res, 'Invalid token', 401)
    }

    const user = await User.findById(decoded.userId).select('+refreshTokens')
    if (!user) return error(res, 'User not found', 401)
    if (!user.isActive) return error(res, 'Account deactivated', 403)

    req.user = user
    req.userId = user._id.toString()
    next()
  } catch (err) {
    logger.error('Auth middleware error:', err)
    return error(res, 'Authentication failed', 401)
  }
}

// ── Respond with TOKEN_EXPIRED code for frontend interceptor ──────────────────
const authenticateWithCode = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided', code: 'NO_TOKEN' })
    }

    const token = authHeader.split(' ')[1]
    let decoded

    try {
      decoded = verifyAccessToken(token)
    } catch (err) {
      const code = err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN'
      return res.status(401).json({ success: false, message: err.message, code })
    }

    const user = await User.findById(decoded.userId)
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or deactivated', code: 'USER_NOT_FOUND' })
    }

    req.user = user
    req.userId = user._id.toString()
    next()
  } catch (err) {
    logger.error('Auth middleware error:', err)
    res.status(401).json({ success: false, message: 'Authentication failed', code: 'AUTH_ERROR' })
  }
}

// ── Role guard ─────────────────────────────────────────────────────────────────
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return error(res, 'Not authenticated', 401)
  if (!roles.includes(req.user.role)) {
    return error(res, 'Insufficient permissions', 403)
  }
  next()
}

// ── Optional auth (attaches user if token exists, doesn't block if not) ───────
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) return next()
    const token = authHeader.split(' ')[1]
    const decoded = verifyAccessToken(token)
    const user = await User.findById(decoded.userId)
    if (user?.isActive) {
      req.user = user
      req.userId = user._id.toString()
    }
  } catch {}
  next()
}

module.exports = { authenticate: authenticateWithCode, requireRole, optionalAuth }
