import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Lock, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI, errMsg } from '../../services/api'
import AuthShell from '../../components/auth/AuthShell'
import { Input, Btn, PwdStrength, Alert } from '../../components/ui'

export default function ResetPasswordPage() {
  const [p] = useSearchParams()
  const token = p.get('token') || ''
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const pwd = watch('newPassword', '')

  const onSubmit = async ({ newPassword }) => {
    if (!token) return toast.error('Invalid link — restart forgot password')
    setLoading(true)
    try {
      await authAPI.resetPassword(token, newPassword)
      setDone(true)
      toast.success('Password reset!')
      setTimeout(() => navigate('/login'), 2500)
    } catch (e) { toast.error(errMsg(e)) }
    finally { setLoading(false) }
  }

  if (done) return (
    <AuthShell title="Password reset!" subtitle="Redirecting to login…">
      <div className="flex flex-col items-center gap-5 py-6">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)' }}>
          <ShieldCheck size={26} style={{ color: '#34d399' }} />
        </div>
        <p style={{ fontSize: '0.875rem', color: '#64748b', textAlign: 'center' }}>Your password was updated successfully.</p>
        <div className="w-6 h-6 rounded-full border-2 spin" style={{ borderColor: 'rgba(52,211,153,0.2)', borderTopColor: '#34d399' }} />
      </div>
    </AuthShell>
  )

  if (!token) return (
    <AuthShell title="Invalid link" subtitle="This reset link has expired.">
      <Alert type="error">Please restart the forgot password process.</Alert>
      <Btn onClick={() => navigate('/forgot-password')} className="mt-4">Go to Forgot Password</Btn>
    </AuthShell>
  )

  return (
    <AuthShell title="Set new password" subtitle="Choose a strong password" back={{ to: '/login', label: '← Login' }}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="fade-up-1">
          <Input label="New password" icon={Lock} type="password" placeholder="Min. 8 characters"
            error={errors.newPassword?.message}
            {...register('newPassword', {
              required: 'Required', minLength: { value: 8, message: 'Min 8 chars' },
              validate: { upper: v => /[A-Z]/.test(v) || 'Need uppercase', num: v => /[0-9]/.test(v) || 'Need number' }
            })} />
          <PwdStrength password={pwd} />
        </div>
        <div className="fade-up-2">
          <Input label="Confirm password" icon={Lock} type="password" placeholder="Same as above"
            error={errors.confirm?.message}
            {...register('confirm', { required: 'Required', validate: v => v === pwd || 'Passwords do not match' })} />
        </div>
        <div className="fade-up-3 pt-1"><Btn type="submit" loading={loading}>Reset Password</Btn></div>
      </form>
    </AuthShell>
  )
}
