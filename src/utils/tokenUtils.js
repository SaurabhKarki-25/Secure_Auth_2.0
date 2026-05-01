const jwt = require('jsonwebtoken')
const crypto = require('crypto')

// ── Generate access + refresh token pair ─────────────────────────────────────
const generateTokens = (userId, role) => {
  const accessToken = jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  )
  const refreshToken = jwt.sign(
    { userId, role },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  )
  return { accessToken, refreshToken }
}

const verifyAccessToken = (token) => jwt.verify(token, process.env.JWT_SECRET)
const verifyRefreshToken = (token) => jwt.verify(token, process.env.JWT_REFRESH_SECRET)

// ── Generate OTP ──────────────────────────────────────────────────────────────
const generateOTP = (length = 6) => {
  const len = parseInt(process.env.OTP_LENGTH) || length
  return crypto.randomInt(Math.pow(10, len - 1), Math.pow(10, len)).toString()
}

const otpExpiry = () => {
  const minutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10
  return new Date(Date.now() + minutes * 60 * 1000)
}

// ── Secure random token (for reset links) ────────────────────────────────────
const generateSecureToken = () => crypto.randomBytes(32).toString('hex')

// ── Hash a token for DB storage ───────────────────────────────────────────────
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex')

// ── Generate backup codes ─────────────────────────────────────────────────────
const generateBackupCodes = (count = 8) => {
  const codes = []
  for (let i = 0; i < count; i++) {
    const part1 = crypto.randomBytes(3).toString('hex').toUpperCase()
    const part2 = crypto.randomBytes(3).toString('hex').toUpperCase()
    codes.push(`${part1}-${part2}`)
  }
  return codes
}

// ── AES-256-CBC encryption for locker items ───────────────────────────────────
// Lazy-init so it runs AFTER dotenv has loaded process.env
let CIPHER_KEY = null
const getCipherKey = () => {
  if (!CIPHER_KEY) {
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not set in .env')
    CIPHER_KEY = crypto.scryptSync(process.env.JWT_SECRET, 'secureauth-locker-salt', 32)
  }
  return CIPHER_KEY
}

const encryptSecret = (text) => {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-cbc', getCipherKey(), iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  return {
    encrypted: encrypted.toString('hex'),
    iv: iv.toString('hex'),
  }
}

const decryptSecret = (encrypted, iv) => {
  const decipher = crypto.createDecipheriv('aes-256-cbc', getCipherKey(), Buffer.from(iv, 'hex'))
  const decrypted = Buffer.concat([decipher.update(Buffer.from(encrypted, 'hex')), decipher.final()])
  return decrypted.toString('utf8')
}

module.exports = {
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  generateOTP,
  otpExpiry,
  generateSecureToken,
  hashToken,
  generateBackupCodes,
  encryptSecret,
  decryptSecret,
}
