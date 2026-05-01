const User = require('../models/User')
const { success, error, paginated } = require('../utils/response')
const { sendEmail, templates } = require('../services/emailService')
const { generateOTP, otpExpiry, generateBackupCodes, encryptSecret, decryptSecret } = require('../utils/tokenUtils')
const { parseDevice } = require('../utils/deviceUtils')
const speakeasy = require('speakeasy')
const qrcode = require('qrcode')
const logger = require('../utils/logger')
const bcrypt = require('bcryptjs')

// ── GET ME ────────────────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    if (!user) return error(res, 'User not found', 404)
    return success(res, user, 'Profile fetched.')
  } catch (err) {
    logger.error('Get me error:', err)
    return error(res, 'Failed to get profile', 500)
  }
}

// ── UPDATE PROFILE ────────────────────────────────────────────────────────────
exports.updateMe = async (req, res) => {
  try {
    const allowed = ['name']
    const updates = {}
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f] })

    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true, runValidators: true })
    if (!user) return error(res, 'User not found', 404)

    await user.logActivity({ action: 'Profile updated', ip: parseDevice(req).ip, device: parseDevice(req).name }).catch(() => {})

    return success(res, user, 'Profile updated.')
  } catch (err) {
    logger.error('Update profile error:', err)
    return error(res, 'Failed to update profile', 500)
  }
}

// ── ENABLE 2FA (Email OTP) ────────────────────────────────────────────────────
exports.enable2FA = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    if (!user) return error(res, 'User not found', 404)
    if (user.twoFactorEnabled) return error(res, '2FA is already enabled', 400)

    user.twoFactorEnabled = true
    await user.save()

    await sendEmail({ to: user.email, ...templates.twoFAEnabled(user.name) }).catch(() => {})
    await user.addNotification({ type: 'security', title: '2FA Enabled', message: 'Email OTP two-factor authentication has been enabled on your account.', actionUrl: '/dashboard/security' }).catch(() => {})
    await user.logActivity({ action: '2FA enabled', ip: parseDevice(req).ip, device: parseDevice(req).name }).catch(() => {})

    return success(res, { twoFactorEnabled: true }, '2FA enabled successfully.')
  } catch (err) {
    logger.error('Enable 2FA error:', err)
    return error(res, 'Failed to enable 2FA', 500)
  }
}

// ── DISABLE 2FA (Email OTP) ───────────────────────────────────────────────────
exports.disable2FA = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    if (!user) return error(res, 'User not found', 404)
    if (!user.twoFactorEnabled) return error(res, '2FA is not enabled', 400)

    user.twoFactorEnabled = false
    await user.save()

    await sendEmail({ to: user.email, ...templates.twoFADisabled(user.name) }).catch(() => {})
    await user.addNotification({ type: 'warning', title: '2FA Disabled', message: 'Email OTP two-factor authentication has been disabled. Your account is now less secure.', actionUrl: '/dashboard/security' }).catch(() => {})
    await user.logActivity({ action: '2FA disabled', ip: parseDevice(req).ip, device: parseDevice(req).name }).catch(() => {})

    return success(res, { twoFactorEnabled: false }, '2FA disabled.')
  } catch (err) {
    logger.error('Disable 2FA error:', err)
    return error(res, 'Failed to disable 2FA', 500)
  }
}

// ── SETUP TOTP ────────────────────────────────────────────────────────────────
exports.setupTOTP = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    if (!user) return error(res, 'User not found', 404)

    const secret = speakeasy.generateSecret({
      name: `SecureAuth:${user.email}`,
      issuer: 'SecureAuth',
      length: 32,
    })

    // Store temporarily (not verified yet)
    user.totpSecret = secret.base32
    user.totpVerified = false
    await user.save()

    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url)

    return success(res, {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url,
      qrCode: qrCodeUrl,
    }, 'TOTP setup initiated. Scan the QR code and verify.')
  } catch (err) {
    logger.error('Setup TOTP error:', err)
    return error(res, 'Failed to setup TOTP', 500)
  }
}

// ── VERIFY TOTP (enable it) ───────────────────────────────────────────────────
exports.verifyTOTP = async (req, res) => {
  try {
    const { token } = req.body
    const user = await User.findById(req.userId).select('+totpSecret')
    if (!user) return error(res, 'User not found', 404)
    if (!user.totpSecret) return error(res, 'TOTP not set up. Call /setup-totp first.', 400)

    const verified = speakeasy.totp.verify({
      secret: user.totpSecret,
      encoding: 'base32',
      token,
      window: 1,
    })

    if (!verified) return error(res, 'Invalid TOTP code', 400)

    user.totpEnabled = true
    user.totpVerified = true
    await user.save()

    await user.addNotification({ type: 'security', title: 'TOTP Enabled', message: 'Google Authenticator / Authy TOTP has been enabled on your account.', actionUrl: '/dashboard/security' }).catch(() => {})
    await user.logActivity({ action: 'TOTP enabled', ip: parseDevice(req).ip, device: parseDevice(req).name }).catch(() => {})

    return success(res, { totpEnabled: true }, 'TOTP enabled successfully.')
  } catch (err) {
    logger.error('Verify TOTP error:', err)
    return error(res, 'TOTP verification failed', 500)
  }
}

// ── DISABLE TOTP ──────────────────────────────────────────────────────────────
exports.disableTOTP = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('+totpSecret')
    if (!user) return error(res, 'User not found', 404)

    user.totpEnabled = false
    user.totpSecret = undefined
    user.totpVerified = false
    await user.save()

    await user.addNotification({ type: 'warning', title: 'TOTP Disabled', message: 'Authenticator app (TOTP) has been disabled on your account.' }).catch(() => {})
    await user.logActivity({ action: 'TOTP disabled', ip: parseDevice(req).ip, device: parseDevice(req).name }).catch(() => {})

    return success(res, { totpEnabled: false }, 'TOTP disabled.')
  } catch (err) {
    logger.error('Disable TOTP error:', err)
    return error(res, 'Failed to disable TOTP', 500)
  }
}

// ── GENERATE BACKUP CODES ─────────────────────────────────────────────────────
exports.generateBackupCodes = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('+backupCodes')
    if (!user) return error(res, 'User not found', 404)

    const codes = generateBackupCodes(8)
    user.backupCodes = codes
    await user.save()

    await sendEmail({ to: user.email, ...templates.backupCodesGenerated(user.name, codes) }).catch(() => {})
    await user.addNotification({ type: 'security', title: 'Backup Codes Generated', message: '8 new backup codes generated. Old codes are now invalid. Store them safely.' }).catch(() => {})
    await user.logActivity({ action: 'Backup codes generated', ip: parseDevice(req).ip, device: parseDevice(req).name }).catch(() => {})

    return success(res, { codes }, 'Backup codes generated. Store them safely — they will only be shown once.')
  } catch (err) {
    logger.error('Generate backup codes error:', err)
    return error(res, 'Failed to generate backup codes', 500)
  }
}

// ── GET DEVICES ───────────────────────────────────────────────────────────────
exports.getDevices = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('devices lastLoginIP lastLoginDevice lastLogin')
    if (!user) return error(res, 'User not found', 404)

    const device = parseDevice(req)
    const devices = user.devices.map(d => ({
      ...d.toObject(),
      current: d.fingerprint === device.fingerprint,
    }))

    return success(res, { devices, lastLoginIP: user.lastLoginIP, lastLoginDevice: user.lastLoginDevice }, 'Devices fetched.')
  } catch (err) {
    logger.error('Get devices error:', err)
    return error(res, 'Failed to fetch devices', 500)
  }
}

// ── REMOVE DEVICE ─────────────────────────────────────────────────────────────
exports.removeDevice = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    if (!user) return error(res, 'User not found', 404)

    const { deviceId } = req.params
    const device = user.devices.id(deviceId)
    if (!device) return error(res, 'Device not found', 404)

    const currentDevice = parseDevice(req)
    if (device.fingerprint === currentDevice.fingerprint) {
      return error(res, 'Cannot remove current device', 400)
    }

    user.devices.pull(deviceId)
    await user.save()

    await user.addNotification({ type: 'security', title: 'Device Removed', message: `Device "${device.name}" has been removed from your account.` }).catch(() => {})

    return success(res, {}, 'Device removed.')
  } catch (err) {
    logger.error('Remove device error:', err)
    return error(res, 'Failed to remove device', 500)
  }
}

// ── GET ACTIVITY LOG ──────────────────────────────────────────────────────────
exports.getActivity = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('activity')
    if (!user) return error(res, 'User not found', 404)
    return success(res, { activity: user.activity }, 'Activity log fetched.')
  } catch (err) {
    logger.error('Get activity error:', err)
    return error(res, 'Failed to fetch activity', 500)
  }
}

// ── CHANGE PASSWORD (from dashboard) ─────────────────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const device = parseDevice(req)

    const user = await User.findById(req.userId).select('+password +refreshTokens')
    if (!user) return error(res, 'User not found', 404)

    const isMatch = await user.comparePassword(currentPassword)
    if (!isMatch) return error(res, 'Current password is incorrect', 400)

    user.password = newPassword
    user.refreshTokens = [] // invalidate all sessions
    await user.save()

    await sendEmail({ to: user.email, ...templates.passwordChanged(user.name, device.ip, new Date().toLocaleString()) }).catch(() => {})
    await user.addNotification({ type: 'security', title: 'Password Changed', message: `Your password was changed from ${device.ip}. If this wasn't you, contact support immediately.` }).catch(() => {})
    await user.logActivity({ action: 'Password changed', ip: device.ip, device: device.name }).catch(() => {})

    return success(res, {}, 'Password changed. Please log in again.')
  } catch (err) {
    logger.error('Change password error:', err)
    return error(res, 'Failed to change password', 500)
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// SECURE LOCKER
// ═════════════════════════════════════════════════════════════════════════════

exports.getLockerItems = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('locker')
    if (!user) return error(res, 'User not found', 404)

    // Return items without decrypting secrets (security)
    const items = user.locker.map(item => {
      const obj = item.toObject()
      delete obj.secret
      delete obj.iv
      return obj
    })

    return success(res, { items, count: items.length }, 'Locker items fetched.')
  } catch (err) {
    logger.error('Get locker items error:', err)
    return error(res, 'Failed to fetch locker items', 500)
  }
}

exports.addLockerItem = async (req, res) => {
  try {
    const { title, category, username, secret, url, notes, tags } = req.body
    const user = await User.findById(req.userId)
    if (!user) return error(res, 'User not found', 404)

    const { encrypted, iv } = encryptSecret(secret)

    user.locker.unshift({ title, category, username, secret: encrypted, iv, url, notes, tags: tags || [] })
    if (user.locker.length > 500) return error(res, 'Locker limit (500 items) reached', 400)

    await user.save()

    const item = user.locker[0].toObject()
    delete item.secret; delete item.iv

    return success(res, { item }, 'Secret saved to locker.', 201)
  } catch (err) {
    logger.error('Add locker item error:', err)
    return error(res, 'Failed to add locker item', 500)
  }
}

exports.getLockerItemSecret = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('locker')
    if (!user) return error(res, 'User not found', 404)

    const item = user.locker.id(req.params.itemId)
    if (!item) return error(res, 'Item not found', 404)

    const plainSecret = decryptSecret(item.secret, item.iv)
    return success(res, { secret: plainSecret }, 'Secret decrypted.')
  } catch (err) {
    logger.error('Get locker secret error:', err)
    return error(res, 'Failed to decrypt secret', 500)
  }
}

exports.updateLockerItem = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    if (!user) return error(res, 'User not found', 404)

    const item = user.locker.id(req.params.itemId)
    if (!item) return error(res, 'Item not found', 404)

    const { title, username, url, notes, tags, secret } = req.body
    if (title !== undefined) item.title = title
    if (username !== undefined) item.username = username
    if (url !== undefined) item.url = url
    if (notes !== undefined) item.notes = notes
    if (tags !== undefined) item.tags = tags
    if (secret !== undefined) {
      const { encrypted, iv } = encryptSecret(secret)
      item.secret = encrypted
      item.iv = iv
    }

    await user.save()

    const updated = item.toObject()
    delete updated.secret; delete updated.iv
    return success(res, { item: updated }, 'Locker item updated.')
  } catch (err) {
    logger.error('Update locker item error:', err)
    return error(res, 'Failed to update locker item', 500)
  }
}

exports.deleteLockerItem = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    if (!user) return error(res, 'User not found', 404)

    const item = user.locker.id(req.params.itemId)
    if (!item) return error(res, 'Item not found', 404)

    user.locker.pull(req.params.itemId)
    await user.save()

    return success(res, {}, 'Locker item deleted.')
  } catch (err) {
    logger.error('Delete locker item error:', err)
    return error(res, 'Failed to delete locker item', 500)
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ═════════════════════════════════════════════════════════════════════════════

exports.getNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('notifications')
    if (!user) return error(res, 'User not found', 404)

    const unreadCount = user.notifications.filter(n => !n.read).length
    return success(res, { notifications: user.notifications, unreadCount }, 'Notifications fetched.')
  } catch (err) {
    logger.error('Get notifications error:', err)
    return error(res, 'Failed to fetch notifications', 500)
  }
}

exports.markNotificationRead = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    if (!user) return error(res, 'User not found', 404)

    const { notifId } = req.params
    if (notifId === 'all') {
      user.notifications.forEach(n => { n.read = true })
    } else {
      const notif = user.notifications.id(notifId)
      if (!notif) return error(res, 'Notification not found', 404)
      notif.read = true
    }

    await user.save()
    return success(res, {}, 'Marked as read.')
  } catch (err) {
    logger.error('Mark notification read error:', err)
    return error(res, 'Failed to mark notification', 500)
  }
}

exports.deleteNotification = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    if (!user) return error(res, 'User not found', 404)

    user.notifications.pull(req.params.notifId)
    await user.save()
    return success(res, {}, 'Notification deleted.')
  } catch (err) {
    logger.error('Delete notification error:', err)
    return error(res, 'Failed to delete notification', 500)
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ADMIN
// ═════════════════════════════════════════════════════════════════════════════

exports.getAllUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(50, parseInt(req.query.limit) || 10)
    const skip = (page - 1) * limit
    const search = req.query.search || ''
    const role = req.query.role
    const active = req.query.active

    const query = {}
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ]
    if (role) query.role = role
    if (active !== undefined) query.isActive = active === 'true'

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-refreshTokens -loginOTP -emailVerifyOTP -passwordResetOTP -backupCodes -totpSecret -locker -notifications -activity')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ])

    return paginated(res, { users, total }, {
      page, limit, pages: Math.ceil(total / limit), total,
    }, 'Users fetched.')
  } catch (err) {
    logger.error('Get all users error:', err)
    return error(res, 'Failed to fetch users', 500)
  }
}

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-refreshTokens -loginOTP -emailVerifyOTP -passwordResetOTP -backupCodes -totpSecret -locker')
    if (!user) return error(res, 'User not found', 404)
    return success(res, user, 'User fetched.')
  } catch (err) {
    logger.error('Get user by id error:', err)
    return error(res, 'Failed to fetch user', 500)
  }
}

exports.deactivateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('+refreshTokens')
    if (!user) return error(res, 'User not found', 404)
    if (user.role === 'admin') return error(res, 'Cannot deactivate an admin account', 403)
    if (req.params.id === req.userId) return error(res, 'Cannot deactivate your own account', 400)

    user.isActive = false
    user.refreshTokens = [] // log out all sessions
    await user.save()

    await sendEmail({ to: user.email, ...templates.accountDeactivated(user.name) }).catch(() => {})

    logger.info(`User deactivated by admin: ${user.email}`)
    return success(res, {}, 'User deactivated.')
  } catch (err) {
    logger.error('Deactivate user error:', err)
    return error(res, 'Failed to deactivate user', 500)
  }
}

exports.reactivateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return error(res, 'User not found', 404)

    user.isActive = true
    await user.save()

    return success(res, {}, 'User reactivated.')
  } catch (err) {
    logger.error('Reactivate user error:', err)
    return error(res, 'Failed to reactivate user', 500)
  }
}

exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body
    if (!['user', 'moderator', 'admin'].includes(role)) {
      return error(res, 'Invalid role', 400)
    }
    if (req.params.id === req.userId) return error(res, 'Cannot change your own role', 400)

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true })
    if (!user) return error(res, 'User not found', 404)

    return success(res, { role: user.role }, 'User role updated.')
  } catch (err) {
    logger.error('Update user role error:', err)
    return error(res, 'Failed to update role', 500)
  }
}

exports.getAdminStats = async (req, res) => {
  try {
    const [total, active, verified, twoFA, admins, today] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isEmailVerified: true }),
      User.countDocuments({ twoFactorEnabled: true }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }),
    ])

    return success(res, {
      total, active, inactive: total - active,
      verified, unverified: total - verified,
      twoFA, noTwoFA: total - twoFA,
      admins, todayRegistrations: today,
    }, 'Stats fetched.')
  } catch (err) {
    logger.error('Admin stats error:', err)
    return error(res, 'Failed to fetch stats', 500)
  }
}
