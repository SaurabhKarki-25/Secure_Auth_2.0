const router = require('express').Router()
const {
  getMe, updateMe, enable2FA, disable2FA,
  setupTOTP, verifyTOTP, disableTOTP,
  generateBackupCodes,
  getDevices, removeDevice, getActivity,
  changePassword,
  getLockerItems, addLockerItem, getLockerItemSecret, updateLockerItem, deleteLockerItem,
  getNotifications, markNotificationRead, deleteNotification,
  getAllUsers, getUserById, deactivateUser, reactivateUser, updateUserRole, getAdminStats,
} = require('../controllers/userController')
const { authenticate, requireRole } = require('../middleware/auth')
const { updateProfileValidator, lockerItemValidator } = require('../middleware/validators')
const { sensitiveLimiter } = require('../middleware/rateLimiter')
const { body } = require('express-validator')
const { validate } = require('../middleware/validators')

// All user routes require auth
router.use(authenticate)

// ── Profile ───────────────────────────────────────────────────────────────────
router.get('/me',      getMe)
router.patch('/me',    updateProfileValidator, updateMe)

// ── 2FA (Email OTP) ───────────────────────────────────────────────────────────
router.post('/enable-2fa',  enable2FA)
router.post('/disable-2fa', disable2FA)

// ── TOTP ──────────────────────────────────────────────────────────────────────
router.post('/setup-totp',   setupTOTP)
router.post('/verify-totp',  [body('token').isLength({ min: 6, max: 6 }).withMessage('6-digit token required'), validate], verifyTOTP)
router.post('/disable-totp', disableTOTP)

// ── Backup Codes ──────────────────────────────────────────────────────────────
router.post('/backup-codes', sensitiveLimiter, generateBackupCodes)

// ── Password (from dashboard) ─────────────────────────────────────────────────
router.post('/change-password', sensitiveLimiter, [
  body('currentPassword').notEmpty().withMessage('Current password required'),
  body('newPassword').isLength({ min: 8 }).withMessage('Min 8 characters').matches(/[A-Z]/).withMessage('Needs uppercase').matches(/[0-9]/).withMessage('Needs number'),
  validate,
], changePassword)

// ── Devices ───────────────────────────────────────────────────────────────────
router.get('/devices',                 getDevices)
router.delete('/devices/:deviceId',    removeDevice)

// ── Activity Log ──────────────────────────────────────────────────────────────
router.get('/activity', getActivity)

// ── Secure Locker ─────────────────────────────────────────────────────────────
router.get('/locker',                          getLockerItems)
router.post('/locker',                         lockerItemValidator, addLockerItem)
router.get('/locker/:itemId/secret',           sensitiveLimiter, getLockerItemSecret)
router.patch('/locker/:itemId',                updateLockerItem)
router.delete('/locker/:itemId',               deleteLockerItem)

// ── Notifications ─────────────────────────────────────────────────────────────
router.get('/notifications',                    getNotifications)
router.patch('/notifications/:notifId/read',    markNotificationRead)
router.delete('/notifications/:notifId',        deleteNotification)

// ── Admin routes ──────────────────────────────────────────────────────────────
router.get('/all',                      requireRole('admin'), getAllUsers)
router.get('/stats',                    requireRole('admin'), getAdminStats)
router.get('/:id',                      requireRole('admin', 'moderator'), getUserById)
router.delete('/:id',                   requireRole('admin'), deactivateUser)
router.patch('/:id/reactivate',         requireRole('admin'), reactivateUser)
router.patch('/:id/role',               requireRole('admin'), [body('role').isIn(['user','moderator','admin']).withMessage('Invalid role'), validate], updateUserRole)

module.exports = router
