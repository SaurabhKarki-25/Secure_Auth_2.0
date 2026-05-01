import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { healthAPI } from '../../services/api'
import {
  ShieldCheck, Mail, Key, Activity, Lock,
  ChevronRight, CheckCircle2, XCircle, Wifi, WifiOff, Plus, Eye,
} from 'lucide-react'
import { Card, Alert } from '../../components/ui'

export default function DashboardHome() {
  const { user } = useAuth()
  const [health, setHealth] = useState(null)

  useEffect(() => {
    const ping = async () => {
      try { const { data } = await healthAPI(); setHealth({ ok: true, ...data }) }
      catch { setHealth({ ok: false }) }
    }
    ping(); const iv = setInterval(ping, 30000); return () => clearInterval(iv)
  }, [])

  const secLevel = [
    user?.isEmailVerified,
    user?.twoFactorEnabled,
  ].filter(Boolean).length

  const levelMap = { 0: { l: 'Basic', c: '#f87171' }, 1: { l: 'Moderate', c: '#f6ad55' }, 2: { l: 'Maximum', c: '#4fd1c5' } }
  const lvl = levelMap[secLevel]

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="fade-up">
        <p style={{ fontSize: '0.7rem', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Overview</p>
        <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '1.6rem', color: '#f1f5f9', marginTop: '0.25rem' }}>
          Hello, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#475569', marginTop: '0.25rem' }}>Here's your security snapshot.</p>
      </div>

      {/* Security level banner */}
      <div className="fade-up-1 panel p-5 flex items-center gap-4" style={{ borderColor: `${lvl.c}25` }}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${lvl.c}18`, border: `1px solid ${lvl.c}30` }}>
          <ShieldCheck size={22} style={{ color: lvl.c }} />
        </div>
        <div className="flex-1">
          <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, color: '#e2e8f0', fontSize: '0.875rem' }}>Security Level: <span style={{ color: lvl.c }}>{lvl.l}</span></p>
          <p style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.15rem' }}>
            {secLevel < 2 ? 'Enable 2FA in Security Settings to reach Maximum protection.' : 'All security layers are active. Great job!'}
          </p>
        </div>
        <Link to="/dashboard/security" className="btn btn-sm btn-outline hidden sm:flex items-center gap-1.5">
          Improve <ChevronRight size={12} />
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 fade-up-2">
        {[
          { icon: Mail,  label: 'Email',   val: user?.isEmailVerified ? 'Verified' : 'Unverified', ok: user?.isEmailVerified,     to: '/dashboard/security' },
          { icon: Key,   label: '2FA',     val: user?.twoFactorEnabled ? 'Enabled' : 'Disabled',   ok: user?.twoFactorEnabled,    to: '/dashboard/security' },
          { icon: Activity, label: 'Activity', val: 'View log',  ok: null, to: '/dashboard/devices' },
          { icon: Lock,  label: 'Locker',  val: 'Manage', ok: null, to: '/dashboard/locker' },
        ].map(({ icon: Icon, label, val, ok, to }) => (
          <Link key={label} to={to} className="stat-card block">
            <div className="flex justify-between items-start mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(91,164,245,0.08)', border: '1px solid rgba(91,164,245,0.12)' }}>
                <Icon size={14} className="text-accent-blue" />
              </div>
              {ok !== null && (ok
                ? <CheckCircle2 size={13} style={{ color: '#34d399' }} />
                : <XCircle size={13} style={{ color: '#f87171' }} />
              )}
            </div>
            <p style={{ fontSize: '0.7rem', color: '#475569' }}>{label}</p>
            <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#e2e8f0', marginTop: '0.15rem' }}>{val}</p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="fade-up-3">
        <Card title="Quick Actions" icon={Activity}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Add Secret',       icon: Plus,      to: '/dashboard/locker',   color: '#5ba4f5' },
              { label: 'View Locker',      icon: Eye,       to: '/dashboard/locker',   color: '#4fd1c5' },
              { label: 'Enable Security',  icon: ShieldCheck,to: '/dashboard/security', color: '#f6ad55' },
              { label: 'View Activity',    icon: Activity,  to: '/dashboard/devices',  color: '#a78bfa' },
            ].map(({ label, icon: Icon, to, color }) => (
              <Link key={label} to={to}
                className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = `${color}30`}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                  <Icon size={15} style={{ color }} />
                </div>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center' }}>{label}</span>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      {/* Server health + Account info */}
      <div className="grid md:grid-cols-2 gap-4 fade-up-4">
        <Card title="Server Health" icon={Wifi} iconColor="text-accent-teal">
          {!health
            ? <div className="flex items-center gap-2 text-slate-600 text-sm"><div className="w-4 h-4 rounded-full border-2 border-slate-800 border-t-slate-500 spin" />Checking…</div>
            : health.ok
              ? <div className="space-y-2.5">
                  <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full pulse-dot" style={{ background: '#34d399' }} /><span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 600 }}>Backend Online</span></div>
                  {[['Service', health.service],['Version', health.version],['Env', health.environment]].map(([k,v]) => (
                    <div key={k} className="flex justify-between"><span style={{ fontSize: '0.75rem', color: '#475569' }}>{k}</span><span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{v}</span></div>
                  ))}
                </div>
              : <div className="flex items-center gap-2"><WifiOff size={14} style={{ color: '#f87171' }} /><span style={{ fontSize: '0.8rem', color: '#f87171' }}>Backend Offline — start server on :5000</span></div>
          }
        </Card>

        <Card title="Account Info" icon={Mail}>
          <div className="space-y-2.5">
            {[
              ['Name',    user?.name],
              ['Email',   user?.email],
              ['Role',    user?.role],
              ['Joined',  user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'],
              ['Last login', user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'First login'],
            ].map(([k,v]) => (
              <div key={k} className="flex justify-between gap-4">
                <span style={{ fontSize: '0.75rem', color: '#475569', flexShrink: 0 }}>{k}</span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'right', wordBreak: 'break-all' }}>{v}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Security checklist */}
      <div className="fade-up-5">
        <Card title="Security Checklist" icon={ShieldCheck}>
          <div className="grid sm:grid-cols-3 gap-2">
            {[
              { l: 'Account created',   ok: true },
              { l: 'Email verified',    ok: !!user?.isEmailVerified },
              { l: '2FA enabled',       ok: !!user?.twoFactorEnabled },
            ].map(({ l, ok }) => (
              <div key={l} className="flex items-center gap-2.5 p-3 rounded-xl" style={{
                background: ok ? 'rgba(52,211,153,0.04)' : 'rgba(255,255,255,0.01)',
                border: `1px solid ${ok ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.05)'}`,
              }}>
                {ok ? <CheckCircle2 size={13} style={{ color: '#34d399', flexShrink: 0 }} /> : <div className="w-3 h-3 rounded-full shrink-0" style={{ border: '1.5px solid #334155' }} />}
                <span style={{ fontSize: '0.75rem', color: ok ? '#94a3b8' : '#475569' }}>{l}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
