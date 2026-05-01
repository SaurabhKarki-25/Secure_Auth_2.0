import { forwardRef, useState, useRef } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import clsx from 'clsx'

// ─── Input ────────────────────────────────────────────────────────────────────
export const Input = forwardRef(({ label, error, icon: Icon, type = 'text', className, hint, ...p }, ref) => {
  const [show, setShow] = useState(false)
  const isPwd = type === 'password'
  return (
    <div className="w-full">
      {label && <label className="label">{label}</label>}
      <div className="relative">
        {Icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"><Icon size={14} /></span>}
        <input
          ref={ref}
          type={isPwd ? (show ? 'text' : 'password') : type}
          className={clsx('field', Icon && 'pl-9', isPwd && 'pr-9', error && 'has-error', className)}
          {...p}
        />
        {isPwd && (
          <button type="button" onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-400 flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-red-400 inline-block" />{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-slate-600">{hint}</p>}
    </div>
  )
})
Input.displayName = 'Input'

// ─── Button ───────────────────────────────────────────────────────────────────
export function Btn({ children, loading, variant = 'primary', size, className, ...p }) {
  return (
    <button className={clsx('btn', `btn-${variant}`, size && `btn-${size}`, className)} disabled={p.disabled || loading} {...p}>
      {loading ? <Loader2 size={15} className="spin" /> : children}
    </button>
  )
}

// ─── OTP Input ────────────────────────────────────────────────────────────────
export function OTPInput({ length = 6, value, onChange }) {
  const refs = useRef([])
  const change = (i, e) => {
    const v = e.target.value.replace(/\D/g, '').slice(-1)
    const a = value.split(''); a[i] = v; onChange(a.join(''))
    if (v && i < length - 1) refs.current[i+1]?.focus()
  }
  const kd = (i, e) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) {
      refs.current[i-1]?.focus()
      const a = value.split(''); a[i-1] = ''; onChange(a.join(''))
    }
    if (e.key === 'ArrowLeft' && i > 0) refs.current[i-1]?.focus()
    if (e.key === 'ArrowRight' && i < length-1) refs.current[i+1]?.focus()
  }
  const paste = (e) => {
    e.preventDefault()
    const d = e.clipboardData.getData('text').replace(/\D/g,'').slice(0, length)
    onChange(d.padEnd(length,'').slice(0,length))
    refs.current[Math.min(d.length, length-1)]?.focus()
  }
  return (
    <div className="flex gap-2 justify-center" onPaste={paste}>
      {Array.from({length}).map((_,i) => (
        <input key={i} ref={el => refs.current[i]=el}
          type="text" inputMode="numeric" maxLength={1}
          value={value[i]||''} onChange={e=>change(i,e)} onKeyDown={e=>kd(i,e)}
          className="otp-box" autoFocus={i===0} />
      ))}
    </div>
  )
}

// ─── Password strength ────────────────────────────────────────────────────────
export function PwdStrength({ password }) {
  if (!password) return null
  const checks = [
    { ok: password.length >= 8,   lbl: '8+ chars' },
    { ok: /[A-Z]/.test(password), lbl: 'Uppercase' },
    { ok: /[0-9]/.test(password), lbl: 'Number' },
    { ok: /[^A-Za-z0-9]/.test(password), lbl: 'Symbol' },
  ]
  const score = checks.filter(c=>c.ok).length
  const colors = ['bg-red-500','bg-orange-400','bg-yellow-400','bg-teal-400']
  const labels = ['Weak','Fair','Good','Strong']
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1 items-center">
        {[0,1,2,3].map(n => (
          <div key={n} className={clsx('h-1 flex-1 rounded-full transition-all',
            n < score ? colors[score-1] : 'bg-slate-800')} />
        ))}
        {score > 0 && <span className="text-xs text-slate-500 ml-1">{labels[score-1]}</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        {checks.map(c => (
          <span key={c.lbl} className={clsx('text-xs flex items-center gap-1', c.ok ? 'text-teal-400' : 'text-slate-700')}>
            <span className={clsx('w-1.5 h-1.5 rounded-full', c.ok ? 'bg-teal-400' : 'bg-slate-800')} />
            {c.lbl}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
export function Toggle({ on, onChange, disabled }) {
  return (
    <button type="button" onClick={() => !disabled && onChange(!on)}
      className={clsx('toggle-track', on ? 'on' : 'off', disabled && 'opacity-40 cursor-not-allowed')}>
      <span className="toggle-thumb" />
    </button>
  )
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 20, className }) {
  return <Loader2 size={size} className={clsx('spin text-accent-blue', className)} />
}

// ─── Section card ─────────────────────────────────────────────────────────────
export function Card({ title, icon: Icon, iconColor = 'text-accent-blue', children, className, action }) {
  return (
    <div className={clsx('panel p-5', className)}>
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-heading">
            {Icon && <Icon size={14} className={iconColor} />}
            {title}
          </h3>
          {action}
        </div>
      )}
      {children}
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────
export function Empty({ icon: Icon, message }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-slate-600">
      {Icon && <Icon size={32} strokeWidth={1.5} />}
      <p className="text-sm">{message}</p>
    </div>
  )
}

// ─── Alert banner ─────────────────────────────────────────────────────────────
export function Alert({ type = 'info', children }) {
  const styles = {
    info:    'bg-blue-500/5   border-blue-500/20   text-blue-300',
    warning: 'bg-amber-500/5  border-amber-500/20  text-amber-300',
    error:   'bg-red-500/5    border-red-500/20    text-red-300',
    success: 'bg-teal-500/5   border-teal-500/20   text-teal-300',
  }
  return (
    <div className={clsx('rounded-xl border px-4 py-3 text-xs leading-relaxed', styles[type])}>
      {children}
    </div>
  )
}
