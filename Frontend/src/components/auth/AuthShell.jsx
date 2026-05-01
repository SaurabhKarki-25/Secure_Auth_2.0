import { Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'

export default function AuthShell({ title, subtitle, children, back }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#07090f', backgroundImage: `linear-gradient(rgba(91,164,245,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(91,164,245,0.025) 1px,transparent 1px)`, backgroundSize: '40px 40px' }}>
      {/* glow orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full" style={{ background: 'rgba(91,164,245,0.05)', filter: 'blur(80px)' }} />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full" style={{ background: 'rgba(79,209,197,0.04)', filter: 'blur(80px)' }} />
      </div>

      {/* nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-5xl mx-auto w-full">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(91,164,245,0.1)', border: '1px solid rgba(91,164,245,0.2)' }}>
            <ShieldCheck size={14} className="text-accent-blue" />
          </div>
          <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '0.875rem', color: '#e2e8f0' }}>SecureAuth</span>
        </Link>
        {back && <Link to={back.to} className="btn btn-ghost btn-sm">{back.label}</Link>}
      </nav>

      {/* card */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md fade-up">
          <div className="text-center mb-7">
            <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '1.5rem', color: '#f1f5f9', marginBottom: '0.4rem' }}>{title}</h1>
            {subtitle && <p style={{ fontSize: '0.825rem', color: '#64748b' }}>{subtitle}</p>}
          </div>
          <div className="auth-card">{children}</div>
        </div>
      </div>
    </div>
  )
}
