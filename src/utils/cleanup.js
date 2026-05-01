const cron = require('node-cron')
const User = require('../models/User')
const logger = require('./logger')

// Run every hour: clean up expired OTPs and old activity records
const startCleanupJobs = () => {
  // Every hour: clear expired OTP fields
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date()
      const result = await User.updateMany(
        {
          $or: [
            { emailVerifyOTPExp: { $lt: now } },
            { passwordResetOTPExp: { $lt: now } },
            { loginOTPExp: { $lt: now } },
            { resetTokenExp: { $lt: now } },
          ],
        },
        {
          $unset: {
            emailVerifyOTP: 1, emailVerifyOTPExp: 1,
            passwordResetOTP: 1, passwordResetOTPExp: 1,
            loginOTP: 1, loginOTPExp: 1,
            resetToken: 1, resetTokenExp: 1,
          },
        }
      )
      if (result.modifiedCount > 0) logger.info(`Cleanup: cleared expired OTPs from ${result.modifiedCount} users`)
    } catch (err) {
      logger.error('Cleanup job error:', err)
    }
  })

  // Every day at midnight: unlock accounts whose lockUntil has passed
  cron.schedule('0 0 * * *', async () => {
    try {
      const result = await User.updateMany(
        { lockUntil: { $lt: new Date() } },
        { $unset: { lockUntil: 1 }, $set: { loginAttempts: 0 } }
      )
      if (result.modifiedCount > 0) logger.info(`Cleanup: unlocked ${result.modifiedCount} accounts`)
    } catch (err) {
      logger.error('Unlock job error:', err)
    }
  })

  logger.info('Cleanup cron jobs started')
}

module.exports = { startCleanupJobs }
