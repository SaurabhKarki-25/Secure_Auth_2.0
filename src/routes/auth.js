const router = require('express').Router()
const {
  register, verifyEmail, login, verify2FA,
  forgotPassword, verifyOTP, resetPassword,
  resendOTP, refreshToken, logout,
} = require('../controllers/authController')
const { authenticate } = require('../middleware/auth')
const {
  registerValidator, loginValidator, verifyEmailValidator,
  forgotPasswordValidator, verifyOTPValidator, resetPasswordValidator,
  verify2FAValidator, refreshTokenValidator,
} = require('../middleware/validators')
const {
  authLimiter, loginLimiter, otpLimiter, forgotPasswordLimiter,
} = require('../middleware/rateLimiter')

// Public auth routes
router.post('/register',        authLimiter,          registerValidator,       register)
router.post('/login',           loginLimiter,         loginValidator,          login)
router.post('/verify-email',    otpLimiter,           verifyEmailValidator,    verifyEmail)
router.post('/verify-2fa',      otpLimiter,           verify2FAValidator,      verify2FA)
router.post('/forgot-password', forgotPasswordLimiter, forgotPasswordValidator, forgotPassword)
router.post('/verify-otp',      otpLimiter,           verifyOTPValidator,      verifyOTP)
router.post('/reset-password',  authLimiter,          resetPasswordValidator,  resetPassword)
router.post('/resend-otp',      otpLimiter,                                    resendOTP)
router.post('/refresh-token',   refreshTokenValidator,                         refreshToken)

// Protected
router.post('/logout', authenticate, logout)

module.exports = router
