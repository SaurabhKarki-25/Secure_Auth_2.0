const rateLimit = require('express-rate-limit')

const createLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    message: { success: false, message },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV === 'test',
  })

// General API limiter
const apiLimiter = createLimiter(15 * 60 * 1000, 200, 'Too many requests, please try again later.')

// Auth routes — stricter
const authLimiter = createLimiter(15 * 60 * 1000, 20, 'Too many auth attempts, please try again in 15 minutes.')

// Login — very strict
const loginLimiter = createLimiter(15 * 60 * 1000, 10, 'Too many login attempts, please try again in 15 minutes.')

// OTP — prevent brute force
const otpLimiter = createLimiter(5 * 60 * 1000, 5, 'Too many OTP attempts, please wait before trying again.')

// Forgot password
const forgotPasswordLimiter = createLimiter(60 * 60 * 1000, 5, 'Too many password reset attempts, try again in an hour.')

// Sensitive operations
const sensitiveLimiter = createLimiter(60 * 60 * 1000, 30, 'Too many requests for this action, please wait.')

module.exports = {
  apiLimiter,
  authLimiter,
  loginLimiter,
  otpLimiter,
  forgotPasswordLimiter,
  sensitiveLimiter,
}
