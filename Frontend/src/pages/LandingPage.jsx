import { Link } from 'react-router-dom'
import { ShieldCheck, Lock, Key, Mail, Activity, Users, Database, ArrowRight, CheckCircle2, Zap, ChevronRight } from 'lucide-react'

const features = [
  { icon: Lock,     title: 'Multi-Level Auth',     desc: 'Register → Email OTP → Login → Optional 2FA — every security layer built in.', color: '#5ba4f5' },
  { icon: Mail,     title: 'OTP Email Delivery',   desc: 'Secure one-time passwords delivered to your inbox via beautiful HTML email templates.', color: '#4fd1c5' },
  { icon: Key,      title: 'TOTP Authenticator',   desc: 'Google Authenticator & Authy support. Scan QR, verify, and you\'re protected offline.', color: '#f6ad55' },
  { icon: Activity, title: 'Adaptive Risk Auth',   desc: 'Device-based detection. New device triggers stronger verification automatically.', color: '#a78bfa' },
  { icon: Database, title: 'Secure Locker',        desc: 'Encrypt and store passwords, notes, and card details in your personal vault.', color: '#34d399' },
  { icon: Users,    title: 'Role-Based Access',    desc: 'Granular user, moderator, and admin roles with fully protected API routes.', color: '#fb7185' },
]

const steps = [
  { n: '01', label: 'Register',      desc: 'Create account with name, email & password.' },
  { n: '02', label: 'Verify Email',  desc: 'Enter the 6-digit OTP sent to your inbox.' },
  { n: '03', label: 'Login',         desc: 'Sign in — optionally enable 2FA for extra security.' },
  { n: '04', label: 'Full Access',   desc: 'Dashboard, Locker, Security settings & more.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: '#07090f', color: '#e2e8f0' }}>
      {/* Grid bg */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(91,164,245,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(91,164,245,0.025) 1px,transparent 1px)`,
        backgroundSize: '40px 40px',
      }} />
      {/* Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div style={{ position: 'absolute', top: '15%', left: '20%', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(91,164,245,0.05)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '20%', right: '15%', width: '350px', height: '350px', borderRadius: '50%', background: 'rgba(79,209,197,0.04)', filter: 'blur(80px)' }} />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(91,164,245,0.1)', border: '1px solid rgba(91,164,245,0.2)' }}>
            <ShieldCheck size={16} className="text-accent-blue" />
          </div>
          <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, color: '#f1f5f9' }}>SecureAuth</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login" className="btn btn-ghost btn-sm">Log in</Link>
          <Link to="/register" className="btn btn-primary btn-sm w-auto px-5">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="badge badge-blue mb-6 inline-flex">
          <Zap size={10} /> Enterprise-grade Auth System
        </div>
        <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 'clamp(2rem,5vw,3.5rem)', lineHeight: 1.1, color: '#f1f5f9', marginBottom: '1.5rem' }}>
          Authentication That<br />
          <span style={{ background: 'linear-gradient(135deg,#5ba4f5,#4fd1c5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Never Compromises
          </span>
        </h1>
        <p style={{ fontSize: '1.05rem', color: '#64748b', maxWidth: '600px', margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
          Multi-level auth with OTP email, TOTP authenticator, adaptive risk engine,
          secure locker, and full role-based access — all production-ready.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link to="/register" className="btn btn-primary w-auto px-8 py-3">Start Free <ArrowRight size={15} /></Link>
          <Link to="/login"    className="btn btn-outline w-auto px-8 py-3">Sign In</Link>
        </div>
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 mt-10">
          {['Email OTP','TOTP 2FA','JWT Tokens','Secure Locker','Role-Based','Adaptive Auth'].map(t => (
            <span key={t} className="flex items-center gap-1.5" style={{ fontSize: '0.75rem', color: '#475569' }}>
              <CheckCircle2 size={11} style={{ color: '#4fd1c5' }} /> {t}
            </span>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-24">
        <p className="text-center mb-10" style={{ fontSize: '0.7rem', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Core Features</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="panel p-6 group transition-all duration-300"
              style={{ cursor: 'default' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = `${color}25`}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `${color}12`, border: `1px solid ${color}22` }}>
                <Icon size={17} style={{ color }} />
              </div>
              <h3 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '0.9rem', color: '#e2e8f0', marginBottom: '0.5rem' }}>{title}</h3>
              <p style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.65 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-24">
        <p className="text-center mb-3" style={{ fontSize: '0.7rem', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.12em' }}>How It Works</p>
        <h2 className="text-center mb-12" style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '1.75rem', color: '#f1f5f9' }}>Four steps to secure</h2>
        <div className="grid sm:grid-cols-4 gap-4">
          {steps.map(({ n, label, desc }, i) => (
            <div key={n} className="text-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{ background: '#111822', border: '1px solid rgba(255,255,255,0.06)', fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '1rem', color: '#5ba4f5' }}>
                {n}
              </div>
              <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '0.875rem', color: '#e2e8f0', marginBottom: '0.4rem' }}>{label}</p>
              <p style={{ fontSize: '0.75rem', color: '#475569', lineHeight: 1.6 }}>{desc}</p>
              {i < steps.length - 1 && <div className="hidden sm:flex justify-center mt-3"><ChevronRight size={14} style={{ color: '#1e293b' }} /></div>}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-xl mx-auto px-6 pb-28 text-center">
        <div className="panel p-10" style={{ borderColor: 'rgba(91,164,245,0.15)', boxShadow: '0 0 60px rgba(91,164,245,0.05)' }}>
          <ShieldCheck size={28} className="text-accent-blue mx-auto mb-4" />
          <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '1.5rem', color: '#f1f5f9', marginBottom: '0.75rem' }}>Ready to start?</h2>
          <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1.75rem' }}>Create your account in under 60 seconds.</p>
          <Link to="/register" className="btn btn-primary w-auto inline-flex px-10">Create Account <ArrowRight size={15} /></Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <p style={{ fontSize: '0.7rem', color: '#1e293b' }}>© {new Date().getFullYear()} SecureAuth • React + Vite + Tailwind</p>
      </footer>
    </div>
  )
}
