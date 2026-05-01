import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../context/AuthContext'
import { userAPI, authAPI, errMsg } from '../../services/api'
import { Lock, KeyRound, ShieldX, LifeBuoy, Send, CheckCircle2, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, Input, Btn, OTPInput, PwdStrength, Alert } from '../../components/ui'

export default function RecoveryPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // Change password state
  const [changingPwd, setChangingPwd] = useState(false)
  const { register: regPwd, handleSubmit: handlePwd, watch, reset: resetPwd, formState: { errors: pwdErr } } = useForm()
  const newPwd = watch('newPassword', '')

  // Forgot password flow state
  const [fpStep, setFpStep] = useState(0) // 0=idle 1=sent 2=otp 3=done
  const [fpOtp, setFpOtp] = useState('')
  const [fpToken, setFpToken] = useState('')
  const [fpLoading, setFpLoading] = useState(false)
  const { register: regFp, handleSubmit: handleFp, watch: watchFp, formState: { errors: fpErr } } = useForm()
  const fpNewPwd = watchFp('newPassword', '')

  // Backup code verify
  const [backupCode, setBackupCode] = useState('')
  const [verifyingCode, setVerifyingCode] = useState(false)

  // Reset TOTP
  const [resetTotpLoading, setResetTotpLoading] = useState(false)

  // ── Change password ──────────────────────────────────────────────────────
  const onChangePwd = async ({ currentPassword, newPassword }) => {
    setChangingPwd(true)
    try {
      // Change password = forgot-password flow using current session email
      // Backend doesn't have a direct change-password route, so we use reset flow
      toast.success('Password change request sent — check your email for OTP')
      await authAPI.forgotPassword(user.email)
      resetPwd()
      navigate(`/verify-otp?email=${encodeURIComponent(user.email)}`)
    } catch (e) { toast.error(errMsg(e)) }
    finally { setChangingPwd(false) }
  }

  // ── Forgot password inline flow ──────────────────────────────────────────
  const sendFpOtp = async () => {
    setFpLoading(true)
    try {
      await authAPI.forgotPassword(user.email)
      toast.success('OTP sent to your email')
      setFpStep(2)
    } catch (e) { toast.error(errMsg(e)) }
    finally { setFpLoading(false) }
  }

  const verifyFpOtp = async () => {
    if (fpOtp.length < 6) return toast.error('Enter all 6 digits')
    setFpLoading(true)
    try {
      const { data } = await authAPI.verifyOTP(user.email, fpOtp)
      setFpToken(data.resetToken)
      setFpStep(3)
      toast.success('OTP verified!')
    } catch (e) { toast.error(errMsg(e)); setFpOtp('') }
    finally { setFpLoading(false) }
  }

  const submitNewPwd = async ({ newPassword }) => {
    setFpLoading(true)
    try {
      await authAPI.resetPassword(fpToken, newPassword)
      toast.success('Password updated! Please log in again.')
      setFpStep(0)
      await logout()
      navigate('/login')
    } catch (e) { toast.error(errMsg(e)) }
    finally { setFpLoading(false) }
  }

  // ── Reset TOTP (mock) ──────────────────────────────────────────────────
  const resetTotp = async () => {
    setResetTotpLoading(true)
    await new Promise(r => setTimeout(r, 1000))
    toast.success('TOTP reset. You can now set up a new authenticator.')
    setResetTotpLoading(false)
  }

  // ── Verify backup code (mock) ──────────────────────────────────────────
  const verifyBackup = async () => {
    if (!backupCode.trim()) return toast.error('Enter a backup code')
    setVerifyingCode(true)
    await new Promise(r => setTimeout(r, 800))
    // Mock: accept any code in format XXXXX-XXXXX
    if (/^[A-Z0-9]{5}-[A-Z0-9]{5}$/.test(backupCode.toUpperCase())) {
      toast.success('Backup code accepted — TOTP has been reset')
      setBackupCode('')
    } else {
      toast.error('Invalid backup code format')
    }
    setVerifyingCode(false)
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="fade-up">
        <p style={{ fontSize: '0.7rem', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Recovery</p>
        <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '1.5rem', color: '#f1f5f9', marginTop: '0.25rem' }}>Password &amp; Recovery</h1>
      </div>

      {/* ── Change Password ── */}
      <Card title="Change Password" icon={Lock} className="fade-up-1">
        <Alert type="info" className="mb-4">
          Changing your password will send an OTP to <strong>{user?.email}</strong> and then redirect you to set a new password.
        </Alert>
        <Btn onClick={onChangePwd} loading={changingPwd}>
          <Send size={14} /> Send Password Reset OTP
        </Btn>
      </Card>

      {/* ── Forgot Password (inline) ── */}
      <Card title="Forgot Password Flow" icon={KeyRound} iconColor="text-amber-400" className="fade-up-2">
        <p style={{ fontSize: '0.75rem', color: '#475569', marginBottom: '1rem' }}>
          Step-by-step inline reset — OTP → Verify → New password without leaving the dashboard.
        </p>

        {fpStep === 0 && (
          <Btn variant="outline" onClick={sendFpOtp} loading={fpLoading}><Send size={14} /> Send OTP to {user?.email}</Btn>
        )}

        {fpStep === 2 && (
          <div className="space-y-4">
            <Alert type="warning">OTP sent to <strong>{user?.email}</strong> — enter it below</Alert>
            <OTPInput length={6} value={fpOtp} onChange={setFpOtp} />
            <div className="flex gap-2">
              <Btn onClick={verifyFpOtp} loading={fpLoading} disabled={fpOtp.length < 6}>Verify OTP</Btn>
              <Btn variant="outline" onClick={() => setFpStep(0)} className="w-auto px-4">Cancel</Btn>
            </div>
          </div>
        )}

        {fpStep === 3 && (
          <form onSubmit={handleFp(submitNewPwd)} className="space-y-4" noValidate>
            <Alert type="success">OTP verified! Set your new password below.</Alert>
            <Input label="New password" type="password" icon={Lock} placeholder="Min. 8 characters"
              error={fpErr.newPassword?.message}
              {...regFp('newPassword', {
                required: 'Required', minLength: { value: 8, message: 'Min 8 chars' },
                validate: { upper: v => /[A-Z]/.test(v) || 'Need uppercase', num: v => /[0-9]/.test(v) || 'Need number' }
              })} />
            <PwdStrength password={fpNewPwd} />
            <Input label="Confirm" type="password" icon={Lock} placeholder="Same as above"
              error={fpErr.confirm?.message}
              {...regFp('confirm', { required: 'Required', validate: v => v === fpNewPwd || 'No match' })} />
            <Btn type="submit" loading={fpLoading}>Update Password</Btn>
          </form>
        )}
      </Card>

      {/* ── Reset TOTP ── */}
      <Card title="Reset TOTP" icon={RefreshCw} iconColor="text-purple-400" className="fade-up-3">
        <p style={{ fontSize: '0.75rem', color: '#475569', marginBottom: '1rem' }}>
          Lost access to your authenticator app? Reset TOTP so you can set up a new one.
          This requires re-verification for security.
        </p>
        <Alert type="warning" className="mb-4">Resetting TOTP will disable your authenticator until you set up a new one.</Alert>
        <Btn variant="danger" onClick={resetTotp} loading={resetTotpLoading} className="w-auto px-6">
          <ShieldX size={14} /> Reset TOTP
        </Btn>
      </Card>

      {/* ── Backup code recovery ── */}
      <Card title="Recover via Backup Code" icon={LifeBuoy} iconColor="text-blue-400" className="fade-up-4">
        <p style={{ fontSize: '0.75rem', color: '#475569', marginBottom: '1rem' }}>
          Lost your device? Enter a backup code to reset your TOTP and regain access.
        </p>
        <div className="space-y-3">
          <div>
            <label className="label">Backup code (format: XXXXX-XXXXX)</label>
            <input value={backupCode} onChange={e => setBackupCode(e.target.value)}
              placeholder="ABCDE-12345"
              className="field"
              style={{ fontFamily: 'monospace', textTransform: 'uppercase' }} />
          </div>
          <Btn onClick={verifyBackup} loading={verifyingCode} disabled={!backupCode.trim()}>
            <CheckCircle2 size={14} /> Verify Backup Code
          </Btn>
        </div>
      </Card>

      {/* Recovery flow diagram */}
      <Card title="Recovery Flow" icon={LifeBuoy} className="fade-up-5">
        <div className="space-y-2">
          {[
            ['1', 'Lost device / no authenticator?', '#5ba4f5'],
            ['2', 'Enter a backup code above',        '#f6ad55'],
            ['3', 'TOTP is reset',                   '#4fd1c5'],
            ['4', 'Log in and set up new TOTP',      '#34d399'],
          ].map(([n, l, c]) => (
            <div key={n} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: `${c}06`, border: `1px solid ${c}15` }}>
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: `${c}20`, color: c, fontFamily: 'Syne,sans-serif' }}>{n}</span>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{l}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
