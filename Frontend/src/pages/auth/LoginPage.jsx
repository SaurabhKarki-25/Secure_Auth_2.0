import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Mail, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { errMsg } from '../../services/api'
import AuthShell from '../../components/auth/AuthShell'
import { Input, Btn, Alert } from '../../components/ui'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (d) => {
  setLoading(true)

  try {
    const r = await login(d)

    // 🔐 STEP BASED FLOW (NO CONFUSION)

    if (r?.step === "EMAIL_NOT_VERIFIED") {
      navigate(`/verify-email?email=${encodeURIComponent(d.email)}`)
      return
    }

    if (r?.step === "OTP_REQUIRED") {
      navigate('/verify-2fa', { state: { userId: r.userId } })
      return
    }

    if (r?.step === "TOTP_REQUIRED") {
      navigate('/reset-password', { state: { userId: r.userId } })
      return
    }

    // ✅ SUCCESS LOGIN
    navigate('/dashboard')

  } catch (e) {
    const errorCode = e?.response?.data?.error
    const msg = errMsg(e)

    toast.error(msg)

    // 🔥 ONLY EMAIL VERIFY SHOULD REDIRECT HERE
    if (errorCode === "EMAIL_NOT_VERIFIED") {
      navigate(`/verify-email?email=${encodeURIComponent(d.email)}`)
    }

    // ❌ DO NOT HANDLE OTP/TOTP HERE
  } finally {
    setLoading(false)
  }
}
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your account" back={{ to: '/', label: '← Home' }}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

        <Input
          label="Email"
          icon={Mail}
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email', { required: 'Required' })}
        />

        <Input
          label="Password"
          icon={Lock}
          type="password"
          placeholder="Your password"
          error={errors.password?.message}
          {...register('password', { required: 'Required' })}
        />

        <Btn type="submit" loading={loading}>Sign In</Btn>

        <Alert type="warning">
          Account locks after <strong>5</strong> failed attempts.
        </Alert>

        <Link to="/register">
          <Btn variant="outline">Create Account</Btn>
        </Link>

      </form>
    </AuthShell>
  )
}