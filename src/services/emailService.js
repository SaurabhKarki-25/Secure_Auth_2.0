const nodemailer = require('nodemailer')
const logger = require('../utils/logger')

let transporter

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false,

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },

  tls: {
    rejectUnauthorized: false,
  },

  connectionTimeout: 60000,
  greetingTimeout: 30000,
  socketTimeout: 60000,
})
    transporter.verify((err, success) => {
      if (err) {
        logger.error(`❌ Zoho SMTP Error: ${err.message}`)
      } else {
        logger.info('✅ Zoho SMTP Ready')
      }
    })
  }

  return transporter
}


// ── Base HTML template ────────────────────────────────────────────────────────
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
  .logo { display:inline-flex; align-items:center; gap:10px; text-decoration:none; }
  .logo-icon { width:40px; height:40px; background:linear-gradient(135deg,#5ba4f5,#4fd1c5); border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:20px; }
  .logo-text { font-size:1.3rem; font-weight:800; color:#f1f5f9; letter-spacing:-0.5px; }
  .body { padding:36px 32px; }
  h2 { font-size:1.25rem; font-weight:700; color:#f1f5f9; margin-bottom:8px; }
  p { font-size:0.9rem; line-height:1.6; color:#64748b; margin-bottom:16px; }
  .otp-box { background:#07090f; border:1px solid rgba(91,164,245,0.2); border-radius:12px; padding:20px; text-align:center; margin:24px 0; }
  .otp-code { font-size:2.2rem; font-weight:800; letter-spacing:12px; color:#5ba4f5; font-family:monospace; }
  .otp-expiry { font-size:0.75rem; color:#334155; margin-top:8px; }
  .btn { display:inline-block; background:linear-gradient(135deg,#5ba4f5,#4fd1c5); color:#07090f; text-decoration:none; font-weight:700; font-size:0.9rem; padding:14px 28px; border-radius:10px; margin:16px 0; }
  .alert { background:rgba(246,173,85,0.08); border:1px solid rgba(246,173,85,0.2); border-radius:10px; padding:14px 16px; margin:20px 0; font-size:0.8rem; color:#f6ad55; }
  .divider { height:1px; background:rgba(255,255,255,0.05); margin:24px 0; }
  .footer { padding:20px 32px; text-align:center; border-top:1px solid rgba(255,255,255,0.05); }
  .footer p { font-size:0.75rem; color:#1e293b; margin:0; }
  .info-row { display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.04); font-size:0.8rem; }
  .info-row:last-child { border-bottom:none; }
  .info-label { color:#334155; }
  .info-value { color:#94a3b8; font-family:monospace; }
  .badge-success { display:inline-block; background:rgba(52,211,153,0.1); color:#34d399; border:1px solid rgba(52,211,153,0.2); border-radius:6px; padding:2px 10px; font-size:0.75rem; font-weight:600; }
  .badge-danger { display:inline-block; background:rgba(248,113,113,0.1); color:#f87171; border:1px solid rgba(248,113,113,0.2); border-radius:6px; padding:2px 10px; font-size:0.75rem; font-weight:600; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="card">
    <div class="header">
      <div class="logo">
        <div class="logo-icon">🔐</div>
        <span class="logo-text">SecureAuth</span>
      </div>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} SecureAuth · This email was sent to you because an action was performed on your account.</p>
      <p style="margin-top:6px">If you didn't request this, you can safely ignore this email.</p>
    </div>
  </div>
</div>
</body>
</html>
`

// ── Email templates ───────────────────────────────────────────────────────────
const templates = {
  verifyEmail: (name, otp) => ({
    subject: '✅ Verify Your Email — SecureAuth',
    html: baseTemplate(`
      <h2>Verify Your Email</h2>
      <p>Hi <strong style="color:#e2e8f0">${name}</strong>, welcome to SecureAuth! Please verify your email address to activate your account.</p>
      <div class="otp-box">
        <div class="otp-code">${otp}</div>
        <div class="otp-expiry">⏱ This code expires in ${process.env.OTP_EXPIRY_MINUTES} minutes</div>
      </div>
      <div class="alert">⚠️ Never share this code with anyone. SecureAuth will never ask for it.</div>
      <p>If you didn't create an account, please ignore this email.</p>
    `, 'Verify Your Email'),
  }),

  loginOTP: (name, otp, ip, device, time) => ({
    subject: '🔐 Login Verification Code — SecureAuth',
    html: baseTemplate(`
      <h2>Login Verification</h2>
      <p>Hi <strong style="color:#e2e8f0">${name}</strong>, use this code to complete your sign-in.</p>
      <div class="otp-box">
        <div class="otp-code">${otp}</div>
        <div class="otp-expiry">⏱ This code expires in ${process.env.OTP_EXPIRY_MINUTES} minutes</div>
      </div>
      <div class="divider"></div>
      <p style="margin-bottom:10px; font-size:0.8rem; color:#475569;">Login details:</p>
      <div class="info-row"><span class="info-label">IP Address</span><span class="info-value">${ip || 'Unknown'}</span></div>
      <div class="info-row"><span class="info-label">Device</span><span class="info-value">${device || 'Unknown'}</span></div>
      <div class="info-row"><span class="info-label">Time</span><span class="info-value">${time}</span></div>
      <div class="alert">⚠️ If this wasn't you, please change your password immediately and contact support.</div>
    `, 'Login Verification'),
  }),

  forgotPassword: (name, otp) => ({
    subject: '🔑 Password Reset OTP — SecureAuth',
    html: baseTemplate(`
      <h2>Reset Your Password</h2>
      <p>Hi <strong style="color:#e2e8f0">${name}</strong>, we received a request to reset your password.</p>
      <div class="otp-box">
        <div class="otp-code">${otp}</div>
        <div class="otp-expiry">⏱ This code expires in ${process.env.OTP_EXPIRY_MINUTES} minutes</div>
      </div>
      <div class="alert">⚠️ If you didn't request a password reset, please secure your account immediately.</div>
    `, 'Reset Your Password'),
  }),

  passwordChanged: (name, ip, time) => ({
    subject: '🛡 Password Changed — SecureAuth',
    html: baseTemplate(`
      <h2>Password Successfully Changed</h2>
      <p>Hi <strong style="color:#e2e8f0">${name}</strong>, your password was just changed.</p>
      <div class="divider"></div>
      <div class="info-row"><span class="info-label">IP Address</span><span class="info-value">${ip || 'Unknown'}</span></div>
      <div class="info-row"><span class="info-label">Time</span><span class="info-value">${time}</span></div>
      <div class="alert">⚠️ If you didn't do this, please contact support immediately and reset your password.</div>
    `, 'Password Changed'),
  }),

  twoFAEnabled: (name) => ({
    subject: '✅ Two-Factor Authentication Enabled — SecureAuth',
    html: baseTemplate(`
      <h2>2FA Enabled Successfully</h2>
      <p>Hi <strong style="color:#e2e8f0">${name}</strong>, two-factor authentication has been enabled on your account.</p>
      <p>From now on, you'll receive an OTP on this email when you sign in. This adds an extra layer of security to your account.</p>
      <div class="alert">💡 Tip: Generate backup codes in your Security Settings in case you lose access to your email.</div>
    `, '2FA Enabled'),
  }),

  twoFADisabled: (name) => ({
    subject: '⚠️ Two-Factor Authentication Disabled — SecureAuth',
    html: baseTemplate(`
      <h2>2FA Disabled</h2>
      <p>Hi <strong style="color:#e2e8f0">${name}</strong>, two-factor authentication has been <strong style="color:#f87171">disabled</strong> on your account.</p>
      <div class="alert">⚠️ Your account is now less secure. We strongly recommend re-enabling 2FA in your Security Settings.</div>
    `, '2FA Disabled'),
  }),

  newDevice: (name, ip, device, location, time) => ({
    subject: '🖥 New Device Login Detected — SecureAuth',
    html: baseTemplate(`
      <h2>New Device Detected</h2>
      <p>Hi <strong style="color:#e2e8f0">${name}</strong>, we noticed a new login from a device we don't recognize.</p>
      <div class="divider"></div>
      <div class="info-row"><span class="info-label">IP Address</span><span class="info-value">${ip || 'Unknown'}</span></div>
      <div class="info-row"><span class="info-label">Device</span><span class="info-value">${device || 'Unknown'}</span></div>
      <div class="info-row"><span class="info-label">Location</span><span class="info-value">${location || 'Unknown'}</span></div>
      <div class="info-row"><span class="info-label">Time</span><span class="info-value">${time}</span></div>
      <div class="alert">⚠️ If this wasn't you, secure your account immediately by changing your password.</div>
    `, 'New Device Login'),
  }),

  accountLocked: (name, unlockTime) => ({
    subject: '🔒 Account Temporarily Locked — SecureAuth',
    html: baseTemplate(`
      <h2>Account Locked</h2>
      <p>Hi <strong style="color:#e2e8f0">${name}</strong>, your account has been temporarily locked due to too many failed login attempts.</p>
      <div class="info-row"><span class="info-label">Unlock Time</span><span class="info-value">${unlockTime}</span></div>
      <div class="alert">⚠️ If this wasn't you, someone may be trying to access your account. Please change your password when you regain access.</div>
    `, 'Account Locked'),
  }),

  welcomeEmail: (name) => ({
    subject: '🎉 Welcome to SecureAuth!',
    html: baseTemplate(`
      <h2>Welcome, ${name}! 🎉</h2>
      <p>Your account has been verified and is now active. You're all set to use SecureAuth.</p>
      <p>Here's what you can do to secure your account:</p>
      <div class="info-row"><span class="info-label">✅</span><span class="info-value">Email verified — done!</span></div>
      <div class="info-row"><span class="info-label">🔐</span><span class="info-value">Enable 2FA in Security Settings</span></div>
      <div class="info-row"><span class="info-label">💾</span><span class="info-value">Generate backup codes</span></div>
      <div class="info-row"><span class="info-label">🔑</span><span class="info-value">Store secrets in Secure Locker</span></div>
      <a href="${process.env.CLIENT_URL}/dashboard" class="btn">Go to Dashboard →</a>
    `, 'Welcome to SecureAuth'),
  }),

  accountDeactivated: (name) => ({
    subject: '⚠️ Account Deactivated — SecureAuth',
    html: baseTemplate(`
      <h2>Account Deactivated</h2>
      <p>Hi <strong style="color:#e2e8f0">${name}</strong>, your account has been deactivated by an administrator.</p>
      <p>If you believe this is a mistake, please contact support.</p>
    `, 'Account Deactivated'),
  }),

  backupCodesGenerated: (name, codes) => ({
    subject: '🔑 New Backup Codes — SecureAuth',
    html: baseTemplate(`
      <h2>New Backup Codes Generated</h2>
      <p>Hi <strong style="color:#e2e8f0">${name}</strong>, new backup codes have been generated for your account. Your previous codes are now invalid.</p>
      <div class="otp-box" style="text-align:left;">
        ${codes.map(c => `<div style="font-family:monospace; color:#5ba4f5; font-size:1rem; padding:4px 0;">${c}</div>`).join('')}
      </div>
      <div class="alert">⚠️ Store these codes safely. Each code can only be used once. These are the only time they'll be shown.</div>
    `, 'Backup Codes'),
  }),
}

// ── Send email ────────────────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await getTransporter().sendMail({
      from: `"SecureAuth" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
    })
    logger.info(`Email sent to ${to}: ${subject} [${info.messageId}]`)
    return info
  } catch (err) {
    logger.error(`Email failed to ${to}: ${err.message}`)
    throw err
  }
}

module.exports = { sendEmail, templates }
