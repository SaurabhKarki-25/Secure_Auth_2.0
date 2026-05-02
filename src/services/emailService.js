const { Resend } = require('resend')
const logger = require('../utils/logger')

// ✅ Resend client
const resend = new Resend(process.env.RESEND_API_KEY)

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
  .card { background:#111822; border-radius:16px; overflow:hidden; }
  .header { padding:32px; text-align:center; }
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

// ── Templates (UNCHANGED LOGIC) ──
const templates = {
  verifyEmail: (name, otp) => ({
    subject: 'Verify Email',
    html: baseTemplate(`<h2>Hello ${name}</h2><p>Your OTP is ${otp}</p>`, 'Verify')
  }),

  loginOTP: (name, otp) => ({
    subject: 'Login OTP',
    html: baseTemplate(`<h2>Hello ${name}</h2><p>Your OTP is ${otp}</p>`, 'Login')
  }),

  forgotPassword: (name, otp) => ({
    subject: 'Reset Password',
    html: baseTemplate(`<h2>Hello ${name}</h2><p>Your OTP is ${otp}</p>`, 'Reset')
  }),
}

// ── ✅ SAME FUNCTION NAME (NO BREAKING CHANGE) ──
const sendEmail = async ({ to, subject, html }) => {
  try {
    const res = await resend.emails.send({
      from: `SecureAuth <${process.env.EMAIL_FROM || 'onboarding@resend.dev'}>`,
      to,
      subject,
      html,
    })

    logger.info(`Email sent to ${to}: ${subject}`)
    return res

  } catch (err) {
    logger.error(`Email failed to ${to}: ${err.message}`)
    throw err
  }
}

module.exports = { sendEmail, templates }