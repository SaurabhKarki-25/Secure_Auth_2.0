import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { User, Mail, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { errMsg } from '../../services/api'
import AuthShell from '../../components/auth/AuthShell'
import { Input, Btn, PwdStrength } from '../../components/ui'

export default function RegisterPage() {
  const { register: doReg } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const pwd = watch('password', '')

  const onSubmit = async (d) => {
    setLoading(true)
    try {
      await doReg(d)
      navigate(`/verify-email?email=${encodeURIComponent(d.email)}`)
    } catch (e) { toast.error(errMsg(e)) }
    finally { setLoading(false) }
  }

  return (
    <AuthShell title="Create account" subtitle="Free, secure, instant" back={{ to: '/login', label: '← Login' }}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="fade-up-1">
          <Input label="Full name" icon={User} placeholder="Jane Doe"
            error={errors.name?.message}
            {...register('name', { required: 'Required', minLength: { value: 2, message: 'Min 2 chars' } })} />
        </div>
        <div className="fade-up-2">
          <Input label="Email" icon={Mail} type="email" placeholder="jane@example.com"
            error={errors.email?.message}
            {...register('email', { required: 'Required', pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' } })} />
        </div>
        <div className="fade-up-3">
          <Input label="Password" icon={Lock} type="password" placeholder="Min. 8 characters"
            error={errors.password?.message}
            {...register('password', {
              required: 'Required',
              minLength: { value: 8, message: 'Min 8 chars' },
              validate: {
                upper: v => /[A-Z]/.test(v) || 'Need an uppercase letter',
                num:   v => /[0-9]/.test(v) || 'Need a number',
              }
            })} />
          <PwdStrength password={pwd} />
        </div>
        <div className="fade-up-4 pt-1"><Btn type="submit" loading={loading}>Create Account</Btn></div>
      </form>
      <div className="divider mt-5"><span style={{ fontSize: '0.7rem', color: '#334155' }}>already registered?</span></div>
      <Link to="/login"><Btn variant="outline" className="mt-2">Sign In</Btn></Link>
    </AuthShell>
  )
}
