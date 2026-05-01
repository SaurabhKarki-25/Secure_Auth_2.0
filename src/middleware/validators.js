const { body, param, query, validationResult } = require('express-validator')
const { error } = require('../utils/response')

// ── Middleware to handle validation errors ─────────────────────────────────────
const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return error(res, 'Validation failed', 422, errors.array().map(e => ({ field: e.path, message: e.msg })))
  }
  next()
}

// ── Auth validators ────────────────────────────────────────────────────────────
const registerValidator = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character'),
  validate,
]

const loginValidator = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
]

const verifyEmailValidator = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('otp').isLength({ min: 4, max: 8 }).isNumeric().withMessage('Valid OTP is required'),
  validate,
]

const forgotPasswordValidator = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  validate,
]

const verifyOTPValidator = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('otp').isLength({ min: 4, max: 8 }).isNumeric().withMessage('Valid OTP is required'),
  validate,
]

const resetPasswordValidator = [
  body('resetToken').notEmpty().withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Must contain uppercase')
    .matches(/[0-9]/).withMessage('Must contain number'),
  validate,
]

const verify2FAValidator = [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('otp').isLength({ min: 4, max: 8 }).withMessage('Valid OTP is required'),
  validate,
]

const refreshTokenValidator = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
  validate,
]

// ── User validators ────────────────────────────────────────────────────────────
const updateProfileValidator = [
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
  validate,
]

// ── Locker validators ──────────────────────────────────────────────────────────
const lockerItemValidator = [
  body('title').trim().notEmpty().isLength({ max: 200 }).withMessage('Title is required (max 200 chars)'),
  body('category').isIn(['password', 'note', 'card', 'website']).withMessage('Invalid category'),
  body('secret').notEmpty().withMessage('Secret is required'),
  body('username').optional().trim().isLength({ max: 200 }),
  body('url').optional().trim().isURL({ require_protocol: false }).withMessage('Invalid URL').isLength({ max: 2000 }),
  body('notes').optional().trim().isLength({ max: 5000 }),
  validate,
]

module.exports = {
  registerValidator,
  loginValidator,
  verifyEmailValidator,
  forgotPasswordValidator,
  verifyOTPValidator,
  resetPasswordValidator,
  verify2FAValidator,
  refreshTokenValidator,
  updateProfileValidator,
  lockerItemValidator,
  validate,
}
