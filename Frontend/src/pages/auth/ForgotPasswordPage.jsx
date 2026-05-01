import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Mail, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI, errMsg } from '../../services/api'
import AuthShell from '../../components/auth/AuthShell'
import { Input, Btn, Alert } from '../../components/ui'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm()

  const onSubmit = async ({ email }) => {
    const cleanEmail = email.trim()

    if (!cleanEmail) {
      toast.error('Email is required')
      return
    }

    setLoading(true)

    try {
      const { data } = await authAPI.forgotPassword(cleanEmail)

      toast.success(data.message || 'OTP sent successfully')

      // ✅ ALWAYS pass email to OTP page
      navigate(`/verify-otp?email=${encodeURIComponent(cleanEmail)}`)

    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Forgot password?"
      subtitle="Enter your email to receive an OTP"
      back={{ to: '/login', label: '← Login' }}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
      >
        {/* Email Input */}
        <div>
          <Input
            label="Registered email"
            icon={Mail}
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /\S+@\S+\.\S+/,
                message: 'Invalid email format'
              }
            })}
          />
        </div>

        {/* Submit Button */}
        <Btn type="submit" loading={loading} disabled={loading}>
          <Send size={14} /> Send Reset OTP
        </Btn>

        {/* Info */}
        <Alert type="info">
          For security, we won’t confirm whether this email exists.
        </Alert>
      </form>
    </AuthShell>
  )
}