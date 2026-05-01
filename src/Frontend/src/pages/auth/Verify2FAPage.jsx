import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Smartphone } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { errMsg } from '../../services/api'
import AuthShell from '../../components/auth/AuthShell'
import { OTPInput, Btn, Alert } from '../../components/ui'

export default function Verify2FAPage() {
  const { verify2FA, pending2FA } = useAuth()
  const navigate = useNavigate()

  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)

  // ✅ FIX: useEffect instead of direct navigate
  useEffect(() => {
    if (!pending2FA) {
      navigate('/login')
    }
  }, [pending2FA, navigate])

  const handle = async () => {
    if (otp.length < 6) return toast.error('Enter all 6 digits')

    setLoading(true)
    try {
      await verify2FA(otp)
      navigate('/dashboard')
    } catch (e) {
      toast.error(errMsg(e))
      setOtp('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Two-Factor Auth" subtitle="Check your email for the 2FA code">
      <div className="space-y-6">
        <div className="flex justify-center">
          <Smartphone size={26} />
        </div>

        <Alert type="info">
          Enter the 6-digit code sent to your email
        </Alert>

        <OTPInput length={6} value={otp} onChange={setOtp} />

        <Btn onClick={handle} loading={loading} disabled={otp.length < 6}>
          Verify & Login
        </Btn>
      </div>
    </AuthShell>
  )
}