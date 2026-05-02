const nodemailer = require('nodemailer')
const logger = require('../utils/logger')

// ─────────────────────────────────────────
// ✅ SINGLE OPTIMIZED TRANSPORTER (POOLING)
// ─────────────────────────────────────────
let transporter

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },

      // 🔥 PERFORMANCE BOOST
      pool: true,
      maxConnections: 5,
      maxMessages: 100,

      // 🔥 TIMEOUT PROTECTION
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
    })

    // ✅ Verify once on startup
    transporter.verify()
      .then(() => logger.info('✅ SMTP Server Ready'))
      .catch(err => logger.error('❌ SMTP Error:', err.message))
  }

  return transporter
}

// ── Base HTML template (UNCHANGED) ──
const baseTemplate = (content, title) => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${title}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#07090f; font-family:'Segoe UI',Arial,sans-serif; color:#94a3b8; }
  .wrapper { max-width:560px; margin:40px auto; padding:0 16px; }
  .card { background:#111822; border:1px solid rgba(255,255,255,0.08); border-radius:16px; overflow:hidden; }
  .header { background:linear-gradient(135deg,#0d1117 0%,#111822 100%); padding:32px; text-align:center; border-bottom:1px solid rgba(255,255,255,0.05); }
  .logo-text { font-size:1.3rem; font-weight:800; color:#f1f5f9; }
  .body { padding:36px 32px; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="card">
    <div class="header">
      <span class="logo-text">SecureAuth</span>
    </div>
    <div class="body">${content}</div>
  </div>
</div>
</body>
</html>
`

// ── Templates (UNCHANGED) ──
const templates = {
  verifyEmail: (name, otp) => ({
    subject: 'Verify Email',
    html: baseTemplate(`<h2>Hello ${name}</h2><p>Your OTP is ${otp}</p>`)
  }),
  loginOTP: (name, otp) => ({
    subject: 'Login OTP',
    html: baseTemplate(`<h2>Hello ${name}</h2><p>Your OTP is ${otp}</p>`)
  }),
  forgotPassword: (name, otp) => ({
    subject: 'Reset Password',
    html: baseTemplate(`<h2>Hello ${name}</h2><p>Your OTP is ${otp}</p>`)
  }),
}

// ─────────────────────────────────────────
// ✅ NON-BLOCKING EMAIL SEND (IMPORTANT)
// ─────────────────────────────────────────
const sendEmail = async ({ to, subject, html }) => {
  try {
    const transport = getTransporter()

    // 🔥 NON-BLOCKING (NO TIMEOUT ISSUE)
    transport.sendMail({
      from: `"SecureAuth" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
    })
    .then(info => {
      logger.info(`Email sent to ${to}: ${subject} [${info.messageId}]`)
    })
    .catch(err => {
      logger.error(`Email failed to ${to}: ${err.message}`)
    })

    return true // ✅ immediate response

  } catch (err) {
    logger.error(`Email error: ${err.message}`)
    return false
  }
}

module.exports = { sendEmail, templates }