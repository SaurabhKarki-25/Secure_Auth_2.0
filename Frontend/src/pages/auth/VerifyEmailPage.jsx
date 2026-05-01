import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { MailCheck, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI, errMsg } from '../../services/api'
import { useCountdown } from '../../hooks'
import AuthShell from '../../components/auth/AuthShell'
import { OTPInput, Btn, Alert } from '../../components/ui'

export default function VerifyEmailPage() {
  const [p] = useSearchParams()
  const email = p.get('email') || ''
  const navigate = useNavigate()
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const { secs, start, active } = useCountdown(60)

  const verify = async () => {
    if (otp.length < 6) return toast.error('Enter all 6 digits')
    setLoading(true)
    try {
      await authAPI.verifyEmail(email, otp)
      toast.success('Email verified! You can now log in.')
      navigate('/login')
    } catch (e) { toast.error(errMsg(e)); setOtp('') }
    finally { setLoading(false) }
  }

  const resend = async () => {
    setResending(true)
    try { await authAPI.resendOTP(email, 'email-verify'); toast.success('New OTP sent!'); start(60); setOtp('') }
    catch (e) { toast.error(errMsg(e)) }
    finally { setResending(false) }
  }

  return (
    <AuthShell title="Verify your email" subtitle={email ? `OTP sent to ${email}` : 'Check your inbox'} back={{ to: '/register', label: '← Back' }}>
      <div className="space-y-6">
        <div className="flex justify-center fade-up-1">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(91,164,245,0.1)', border: '1px solid rgba(91,164,245,0.2)' }}>
            <MailCheck size={26} className="text-accent-blue" />
          </div>
        </div>
        <div className="fade-up-2">
          <p className="label text-center mb-3">Enter 6-digit OTP</p>
          <OTPInput length={6} value={otp} onChange={setOtp} />
        </div>
        <div className="fade-up-3"><Btn onClick={verify} loading={loading} disabled={otp.length < 6}>Verify Email</Btn></div>
        <div className="text-center fade-up-4">
          {active
            ? <p style={{ fontSize: '0.75rem', color: '#475569' }}>Resend in <span className="text-accent-blue font-bold">{secs}s</span></p>
            : <button onClick={resend} disabled={resending} className="flex items-center gap-1.5 mx-auto" style={{ fontSize: '0.75rem', color: '#5ba4f5', background: 'none', border: 'none', cursor: 'pointer' }}>
                <RefreshCw size={11} className={resending ? 'spin' : ''} />
                {resending ? 'Sending…' : 'Resend OTP'}
              </button>
          }
        </div>
        <Alert type="info">Check spam/junk if you don't see the email within 1 minute.</Alert>
      </div>
    </AuthShell>
  )
}
