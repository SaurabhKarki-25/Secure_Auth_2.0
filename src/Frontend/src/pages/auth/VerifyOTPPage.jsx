import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { KeyRound, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI, errMsg } from '../../services/api'
import { useCountdown } from '../../hooks'
import AuthShell from '../../components/auth/AuthShell'
import { OTPInput, Btn, Alert } from '../../components/ui'

export default function VerifyOTPPage() {
  const [p] = useSearchParams()
  const email = p.get('email') || ''
  const navigate = useNavigate()

  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const { secs, start, active } = useCountdown(0)

  // ✅ IMPORTANT: redirect if email missing
  useEffect(() => {
    if (!email) {
      toast.error('Email missing. Please start again.')
      navigate('/forgot-password')
    }
  }, [email, navigate])

  const verify = async () => {
    if (!email) return
    if (otp.length < 6) return toast.error('Enter all 6 digits')

    setLoading(true)
    try {
      const { data } = await authAPI.verifyOTP(email, otp)

      // ✅ FIX: correct path
      const token = data?.data?.resetToken

      if (!token) {
        throw new Error('Invalid response from server')
      }

      toast.success('OTP verified!')
      navigate(`/reset-password?token=${encodeURIComponent(token)}`)

    } catch (e) {
      toast.error(errMsg(e))
      setOtp('')
    } finally {
      setLoading(false)
    }
  }

  const resend = async () => {
    setResending(true)
    try {
      await authAPI.resendOTP(email, 'forgot_password') // ✅ FIX TYPE
      toast.success('New OTP sent!')
      start(60)
      setOtp('')
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthShell
      title="Enter OTP"
      subtitle={`Reset code sent to ${email}`}
      back={{ to: '/forgot-password', label: '← Back' }}
    >
      <div className="space-y-6">

        <div className="flex justify-center">
          <KeyRound size={26} />
        </div>

        <OTPInput length={6} value={otp} onChange={setOtp} />

        <Btn onClick={verify} loading={loading} disabled={otp.length < 6}>
          Verify OTP
        </Btn>

        <div className="text-center">
          {active
            ? <p>Resend in {secs}s</p>
            : <button onClick={resend} disabled={resending}>
                {resending ? 'Sending…' : 'Resend OTP'}
              </button>
          }
        </div>

        <Alert type="warning">
          OTP expires in 10 minutes
        </Alert>

      </div>
    </AuthShell>
  )
}