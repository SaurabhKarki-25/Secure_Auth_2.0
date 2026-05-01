const User = require('../models/User')
const { sendEmail, templates } = require('../services/emailService')
const {
  generateTokens, verifyRefreshToken,
  generateOTP, otpExpiry,
  generateSecureToken, hashToken, generateBackupCodes,
} = require('../utils/tokenUtils')
const { success, error } = require('../utils/response')
const { parseDevice } = require('../utils/deviceUtils')
const logger = require('../utils/logger')
const speakeasy = require('speakeasy')
const qrcode = require('qrcode')
const bcrypt = require('bcryptjs')

// ── REGISTER ───────────────────────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body

    const existing = await User.findOne({ email })
    if (existing) {
      if (!existing.isEmailVerified) {
        // Resend OTP for unverified account
        const otp = generateOTP()
        existing.emailVerifyOTP = otp
        existing.emailVerifyOTPExp = otpExpiry()
        await existing.save()
        await sendEmail({ to: email, ...templates.verifyEmail(existing.name, otp) })
        return success(res, {}, 'Account exists but email not verified. OTP resent.', 200)
      }
      return error(res, 'Email already registered', 409)
    }

    const otp = generateOTP()
    const user = await User.create({
      name, email, password,
      emailVerifyOTP: otp,
      emailVerifyOTPExp: otpExpiry(),
    })

    await sendEmail({ to: email, ...templates.verifyEmail(name, otp) })

    logger.info(`New user registered: ${email}`)
    return success(res, { email }, 'Registration successful! Check your email for the verification code.', 201)
  } catch (err) {
    logger.error('Register error:', err)
    return error(res, 'Registration failed', 500)
  }
}

// ── VERIFY EMAIL ───────────────────────────────────────────────────────────────
exports.verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body

    const user = await User.findOne({ email }).select('+emailVerifyOTP +emailVerifyOTPExp')
    if (!user) return error(res, 'User not found', 404)
    if (user.isEmailVerified) return error(res, 'Email already verified', 400)

    if (!user.emailVerifyOTP || user.emailVerifyOTP !== otp) {
      return error(res, 'Invalid OTP', 400)
    }
    if (user.emailVerifyOTPExp < new Date()) {
      return error(res, 'OTP has expired. Please request a new one.', 400)
    }

    user.isEmailVerified = true
    user.emailVerifyOTP = undefined
    user.emailVerifyOTPExp = undefined
    await user.save()

    // Send welcome email
    await sendEmail({ to: email, ...templates.welcomeEmail(user.name) }).catch(() => {})

    // Add welcome notification
    await user.addNotification({
      type: 'success',
      title: 'Email Verified',
      message: 'Your email has been verified. Your account is now fully active.',
    })

    logger.info(`Email verified: ${email}`)
    return success(res, {}, 'Email verified successfully! You can now log in.')
  } catch (err) {
    logger.error('Verify email error:', err)
    return error(res, 'Verification failed', 500)
  }
}

// ── LOGIN ──────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body
    const device = parseDevice(req)

    const user = await User.findOne({ email })
      .select('+password +loginOTP +loginOTPExp +refreshTokens +backupCodes')

    if (!user) {
      return error(res, 'Invalid email or password', 401)
    }

    // Check if account is active
    if (!user.isActive) {
      return error(res, 'Account has been deactivated. Contact support.', 403)
    }

    // Check lockout
    if (user.isLocked) {
      const remaining = Math.ceil((user.lockUntil - Date.now()) / 60000)
      return error(res, `Account locked. Try again in ${remaining} minute(s).`, 423)
    }

    // Validate password
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      await user.incLoginAttempts()

      const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5
      const remaining = maxAttempts - (user.loginAttempts + 1)

      // If now locked, send email
      if (user.loginAttempts + 1 >= maxAttempts) {
        const unlockTime = new Date(Date.now() + parseInt(process.env.LOCK_TIME_MINUTES) * 60000).toLocaleString()
        await sendEmail({ to: email, ...templates.accountLocked(user.name, unlockTime) }).catch(() => {})
        await user.addNotification({ type: 'warning', title: 'Account Locked', message: `Account locked due to too many failed login attempts. Try again at ${unlockTime}.` }).catch(() => {})
      }

      await user.logActivity({ action: 'Failed login', ip: device.ip, device: device.name, status: 'failed' }).catch(() => {})
      return error(res, `Invalid email or password. ${remaining > 0 ? `${remaining} attempt(s) remaining.` : 'Account locked.'}`, 401)
    }

    // Verify email check
    if (!user.isEmailVerified) {
      return error(res, 'Please verify your email before logging in.', 403)
    }

    // Reset failed attempts
    await user.resetLoginAttempts()

    // ── 2FA: Email OTP ────────────────────────────────────────────────────────
    if (user.twoFactorEnabled) {
      const otp = generateOTP()
      user.loginOTP = otp
      user.loginOTPExp = otpExpiry()
      await user.save()

      await sendEmail({
        to: email,
        ...templates.loginOTP(user.name, otp, device.ip, device.name, new Date().toLocaleString()),
      })

      logger.info(`2FA OTP sent: ${email}`)
      return success(res, { requires2FA: true, userId: user._id }, '2FA verification required. OTP sent to your email.')
    }

    // ── Normal login ──────────────────────────────────────────────────────────
    const { accessToken, refreshToken } = generateTokens(user._id, user.role)

    // Store refresh token
    if (!user.refreshTokens) user.refreshTokens = []
    user.refreshTokens.push(refreshToken)
    if (user.refreshTokens.length > 5) user.refreshTokens = user.refreshTokens.slice(-5)

    // Update login metadata
    user.lastLogin = new Date()
    user.lastLoginIP = device.ip
    user.lastLoginDevice = device.name
    await user.save()

    // Device tracking: check if new device
    const existingDevice = user.devices.find(d => d.fingerprint === device.fingerprint)
    if (!existingDevice) {
      user.devices.unshift({ ...device, lastActive: new Date() })
      if (user.devices.length > 10) user.devices = user.devices.slice(0, 10)
      await user.save()
      // Notify about new device
      await sendEmail({ to: email, ...templates.newDevice(user.name, device.ip, device.name, device.location, new Date().toLocaleString()) }).catch(() => {})
      await user.addNotification({ type: 'warning', title: 'New Device Login', message: `Login from new device: ${device.name} (${device.ip})`, actionUrl: '/dashboard/devices' }).catch(() => {})
    } else {
      existingDevice.lastActive = new Date()
      await user.save()
    }

    await user.logActivity({ action: 'Login', ip: device.ip, device: device.name, status: 'success' }).catch(() => {})

    const userObj = user.toObject()
    delete userObj.password; delete userObj.refreshTokens; delete userObj.loginOTP
    delete userObj.emailVerifyOTP; delete userObj.passwordResetOTP; delete userObj.backupCodes
    delete userObj.totpSecret

    logger.info(`Login success: ${email}`)
    return success(res, { accessToken, refreshToken, user: userObj }, `Welcome back, ${user.name}!`)
  } catch (err) {
    logger.error('Login error:', err)
    return error(res, 'Login failed', 500)
  }
}

// ── VERIFY 2FA ────────────────────────────────────────────────────────────────
exports.verify2FA = async (req, res) => {
  try {
    const { userId, otp } = req.body
    const device = parseDevice(req)

    const user = await User.findById(userId).select('+loginOTP +loginOTPExp +refreshTokens +backupCodes +totpSecret')
    if (!user) return error(res, 'User not found', 404)

    let verified = false

    // Check email OTP
    if (user.loginOTP && user.loginOTP === otp && user.loginOTPExp > new Date()) {
      verified = true
      user.loginOTP = undefined
      user.loginOTPExp = undefined
    }
    // Check TOTP
    else if (user.totpEnabled && user.totpSecret) {
      verified = speakeasy.totp.verify({
        secret: user.totpSecret,
        encoding: 'base32',
        token: otp,
        window: 1,
      })
    }
    // Check backup codes
    else if (user.backupCodes?.length) {
      const idx = user.backupCodes.indexOf(otp.toUpperCase())
      if (idx !== -1) {
        verified = true
        user.backupCodes.splice(idx, 1) // consume the backup code
        await user.addNotification({ type: 'warning', title: 'Backup Code Used', message: `A backup code was used to sign in from ${device.ip}. Remaining: ${user.backupCodes.length}` }).catch(() => {})
      }
    }

    if (!verified) {
      return error(res, 'Invalid or expired OTP', 400)
    }

    const { accessToken, refreshToken } = generateTokens(user._id, user.role)
    if (!user.refreshTokens) user.refreshTokens = []
    user.refreshTokens.push(refreshToken)
    if (user.refreshTokens.length > 5) user.refreshTokens = user.refreshTokens.slice(-5)

    user.lastLogin = new Date()
    user.lastLoginIP = device.ip
    user.lastLoginDevice = device.name
    await user.save()

    await user.logActivity({ action: '2FA verified', ip: device.ip, device: device.name, status: 'success' }).catch(() => {})

    const userObj = user.toObject()
    ;['password','refreshTokens','loginOTP','emailVerifyOTP','passwordResetOTP','backupCodes','totpSecret'].forEach(k => delete userObj[k])

    return success(res, { accessToken, refreshToken, user: userObj }, '2FA verified! Welcome back.')
  } catch (err) {
    logger.error('Verify 2FA error:', err)
    return error(res, '2FA verification failed', 500)
  }
}

// ── FORGOT PASSWORD ────────────────────────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body
    const user = await User.findOne({ email })

    // Don't reveal if email exists
    if (!user || !user.isEmailVerified) {
      return success(res, {}, 'If that email is registered, you will receive an OTP shortly.')
    }

    const otp = generateOTP()
    user.passwordResetOTP = otp
    user.passwordResetOTPExp = otpExpiry()
    await user.save()

    await sendEmail({ to: email, ...templates.forgotPassword(user.name, otp) })

    logger.info(`Password reset OTP sent: ${email}`)
    return success(res, {}, 'OTP sent to your email address.')
  } catch (err) {
    logger.error('Forgot password error:', err)
    return error(res, 'Failed to send OTP', 500)
  }
}

// ── VERIFY OTP (for password reset) ───────────────────────────────────────────
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body

    const user = await User.findOne({ email }).select('+passwordResetOTP +passwordResetOTPExp')
    if (!user) return error(res, 'User not found', 404)

    if (!user.passwordResetOTP || user.passwordResetOTP !== otp) {
      return error(res, 'Invalid OTP', 400)
    }
    if (user.passwordResetOTPExp < new Date()) {
      return error(res, 'OTP has expired. Please request a new one.', 400)
    }

    // Generate a short-lived reset token
    const resetToken = generateSecureToken()
    user.resetToken = hashToken(resetToken)
    user.resetTokenExp = new Date(Date.now() + 15 * 60 * 1000) // 15 min
    user.passwordResetOTP = undefined
    user.passwordResetOTPExp = undefined
    await user.save()

    return success(res, { resetToken }, 'OTP verified. Use the reset token to set a new password.')
  } catch (err) {
    logger.error('Verify OTP error:', err)
    return error(res, 'OTP verification failed', 500)
  }
}

// ── RESET PASSWORD ────────────────────────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body
    const device = parseDevice(req)

    const hashed = hashToken(resetToken)
    const user = await User.findOne({ resetToken: hashed, resetTokenExp: { $gt: new Date() } }).select('+resetToken +resetTokenExp +refreshTokens')
    if (!user) return error(res, 'Invalid or expired reset token', 400)

    user.password = newPassword
    user.resetToken = undefined
    user.resetTokenExp = undefined
    user.refreshTokens = [] // invalidate all sessions
    await user.save()

    await sendEmail({ to: user.email, ...templates.passwordChanged(user.name, device.ip, new Date().toLocaleString()) }).catch(() => {})

    await user.addNotification({ type: 'security', title: 'Password Changed', message: `Your password was changed from ${device.ip}. If this wasn't you, contact support.` }).catch(() => {})
    await user.logActivity({ action: 'Password reset', ip: device.ip, device: device.name, status: 'success' }).catch(() => {})

    logger.info(`Password reset: ${user.email}`)
    return success(res, {}, 'Password reset successfully. Please log in with your new password.')
  } catch (err) {
    logger.error('Reset password error:', err)
    return error(res, 'Password reset failed', 500)
  }
}

// ── RESEND OTP ─────────────────────────────────────────────────────────────────
exports.resendOTP = async (req, res) => {
  try {
    const { email, type } = req.body // type: 'email_verify' | 'forgot_password' | 'login_2fa'

    const user = await User.findOne({ email }).select('+emailVerifyOTP +emailVerifyOTPExp +passwordResetOTP +passwordResetOTPExp +loginOTP +loginOTPExp')
    if (!user) return error(res, 'User not found', 404)

    const otp = generateOTP()
    const exp = otpExpiry()

    if (type === 'email_verify') {
      if (user.isEmailVerified) return error(res, 'Email already verified', 400)
      user.emailVerifyOTP = otp
      user.emailVerifyOTPExp = exp
      await user.save()
      await sendEmail({ to: email, ...templates.verifyEmail(user.name, otp) })
    } else if (type === 'forgot_password') {
      user.passwordResetOTP = otp
      user.passwordResetOTPExp = exp
      await user.save()
      await sendEmail({ to: email, ...templates.forgotPassword(user.name, otp) })
    } else if (type === 'login_2fa') {
      user.loginOTP = otp
      user.loginOTPExp = exp
      await user.save()
      const device = parseDevice(req)
      await sendEmail({ to: email, ...templates.loginOTP(user.name, otp, device.ip, device.name, new Date().toLocaleString()) })
    } else {
      return error(res, 'Invalid OTP type', 400)
    }

    return success(res, {}, 'OTP resent successfully.')
  } catch (err) {
    logger.error('Resend OTP error:', err)
    return error(res, 'Failed to resend OTP', 500)
  }
}

// ── REFRESH TOKEN ──────────────────────────────────────────────────────────────
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body

    let decoded
    try {
      decoded = verifyRefreshToken(refreshToken)
    } catch {
      return error(res, 'Invalid or expired refresh token', 401)
    }

    const user = await User.findById(decoded.userId).select('+refreshTokens')
    if (!user || !user.isActive) return error(res, 'User not found', 401)

    if (!user.refreshTokens?.includes(refreshToken)) {
      // Token reuse detected — invalidate all
      user.refreshTokens = []
      await user.save()
      logger.warn(`Refresh token reuse detected for user ${user.email}`)
      return error(res, 'Refresh token reuse detected. Please log in again.', 401)
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id, user.role)

    // Rotate refresh token
    user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken)
    user.refreshTokens.push(newRefreshToken)
    await user.save()

    return success(res, { accessToken, refreshToken: newRefreshToken }, 'Token refreshed.')
  } catch (err) {
    logger.error('Refresh token error:', err)
    return error(res, 'Token refresh failed', 500)
  }
}

// ── LOGOUT ─────────────────────────────────────────────────────────────────────
exports.logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader?.split(' ')[1]
    const { refreshToken } = req.body

    if (req.user) {
      const user = await User.findById(req.user._id).select('+refreshTokens')
      if (user && refreshToken) {
        user.refreshTokens = (user.refreshTokens || []).filter(t => t !== refreshToken)
        await user.save()
      }
    }

    return success(res, {}, 'Logged out successfully.')
  } catch (err) {
    logger.error('Logout error:', err)
    return success(res, {}, 'Logged out.')
  }
}
