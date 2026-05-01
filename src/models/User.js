const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const deviceSchema = new mongoose.Schema({
  fingerprint:  { type: String },
  name:         { type: String },
  type:         { type: String, enum: ['desktop', 'mobile', 'tablet', 'unknown'], default: 'unknown' },
  browser:      { type: String },
  os:           { type: String },
  ip:           { type: String },
  location:     { type: String, default: 'Unknown' },
  lastActive:   { type: Date, default: Date.now },
  trusted:      { type: Boolean, default: false },
}, { _id: true })

const activitySchema = new mongoose.Schema({
  action:    { type: String, required: true },
  ip:        { type: String },
  device:    { type: String },
  location:  { type: String, default: 'Unknown' },
  status:    { type: String, enum: ['success', 'failed', 'warning'], default: 'success' },
  meta:      { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true })

const lockerItemSchema = new mongoose.Schema({
  title:     { type: String, required: true, trim: true, maxlength: 200 },
  category:  { type: String, enum: ['password', 'note', 'card', 'website'], default: 'password' },
  username:  { type: String, trim: true, maxlength: 200 },
  secret:    { type: String, required: true },   // stored AES-256 encrypted
  url:       { type: String, trim: true, maxlength: 2000 },
  notes:     { type: String, trim: true, maxlength: 5000 },
  iv:        { type: String },  // encryption IV
  tags:      [{ type: String, trim: true, maxlength: 50 }],
}, { timestamps: true })

const notificationSchema = new mongoose.Schema({
  type:      { type: String, enum: ['security', 'info', 'warning', 'success'], default: 'info' },
  title:     { type: String, required: true },
  message:   { type: String, required: true },
  read:      { type: Boolean, default: false },
  actionUrl: { type: String },
  meta:      { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true })

const userSchema = new mongoose.Schema({
  // ── Core ──────────────────────────────────────────────────────────────────
  name:       { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  email:      { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 255 },
  password:   { type: String, required: true, minlength: 8, select: false },
  role:       { type: String, enum: ['user', 'admin', 'moderator'], default: 'user' },
  isActive:   { type: Boolean, default: true },

  // ── Email verification ─────────────────────────────────────────────────────
  isEmailVerified:     { type: Boolean, default: false },
  emailVerifyOTP:      { type: String, select: false },
  emailVerifyOTPExp:   { type: Date, select: false },

  // ── Two-Factor Auth (Email OTP) ────────────────────────────────────────────
  twoFactorEnabled:    { type: Boolean, default: false },
  loginOTP:            { type: String, select: false },
  loginOTPExp:         { type: Date, select: false },

  // ── TOTP (Authenticator App) ───────────────────────────────────────────────
  totpEnabled:         { type: Boolean, default: false },
  totpSecret:          { type: String, select: false },
  totpVerified:        { type: Boolean, default: false },

  // ── Backup Codes ───────────────────────────────────────────────────────────
  backupCodes:         { type: [String], select: false },

  // ── Password Reset ─────────────────────────────────────────────────────────
  passwordResetOTP:    { type: String, select: false },
  passwordResetOTPExp: { type: Date, select: false },
  resetToken:          { type: String, select: false },
  resetTokenExp:       { type: Date, select: false },

  // ── Security ───────────────────────────────────────────────────────────────
  loginAttempts:  { type: Number, default: 0 },
  lockUntil:      { type: Date },
  lastLogin:      { type: Date },
  lastLoginIP:    { type: String },
  lastLoginDevice:{ type: String },
  passwordChangedAt: { type: Date },

  // ── Tokens ─────────────────────────────────────────────────────────────────
  refreshTokens:  { type: [String], select: false },

  // ── Devices, Activity, Locker, Notifications ───────────────────────────────
  devices:        { type: [deviceSchema], default: [] },
  activity:       { type: [activitySchema], default: [] },
  locker:         { type: [lockerItemSchema], default: [] },
  notifications:  { type: [notificationSchema], default: [] },

}, {
  timestamps: true,
  toJSON:   { virtuals: true, transform: (_, ret) => { delete ret.__v; return ret } },
  toObject: { virtuals: true },
})

// ── Indexes ────────────────────────────────────────────────────────────────────
userSchema.index({ email: 1 })
userSchema.index({ role: 1 })
userSchema.index({ isActive: 1 })
userSchema.index({ createdAt: -1 })

// ── Virtual: account locked? ───────────────────────────────────────────────────
userSchema.virtual('isLocked').get(function () {
  return this.lockUntil && this.lockUntil > Date.now()
})

// ── Hash password before save ─────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12
  this.password = await bcrypt.hash(this.password, rounds)
  this.passwordChangedAt = new Date()
  next()
})

// ── Compare password ───────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.password)
}

// ── Increment login attempts ───────────────────────────────────────────────────
userSchema.methods.incLoginAttempts = async function () {
  const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5
  const lockMinutes = parseInt(process.env.LOCK_TIME_MINUTES) || 15

  if (this.lockUntil && this.lockUntil < Date.now()) {
    // Reset after lock expired
    return this.updateOne({ $set: { loginAttempts: 1 }, $unset: { lockUntil: 1 } })
  }

  const updates = { $inc: { loginAttempts: 1 } }
  if (this.loginAttempts + 1 >= maxAttempts) {
    updates.$set = { lockUntil: new Date(Date.now() + lockMinutes * 60 * 1000) }
  }
  return this.updateOne(updates)
}

// ── Reset login attempts after successful login ─────────────────────────────────
userSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({ $set: { loginAttempts: 0 }, $unset: { lockUntil: 1 } })
}

// ── Add notification ───────────────────────────────────────────────────────────
userSchema.methods.addNotification = async function ({ type, title, message, actionUrl, meta }) {
  this.notifications.unshift({ type, title, message, actionUrl, meta })
  // Keep max 50 notifications
  if (this.notifications.length > 50) {
    this.notifications = this.notifications.slice(0, 50)
  }
  return this.save()
}

// ── Log activity ───────────────────────────────────────────────────────────────
userSchema.methods.logActivity = async function ({ action, ip, device, location, status = 'success', meta }) {
  this.activity.unshift({ action, ip, device, location, status, meta })
  // Keep max 100 activity records
  if (this.activity.length > 100) {
    this.activity = this.activity.slice(0, 100)
  }
  return this.save()
}

module.exports = mongoose.model('User', userSchema)
