import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  ShieldCheck, LayoutDashboard, Shield, Smartphone,
  KeyRound, Lock, LogOut, Users, ChevronRight,
} from 'lucide-react'
import clsx from 'clsx'

const mainNav = [
  { to: '/dashboard',          icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dashboard/security', icon: Shield,          label: 'Security' },
  { to: '/dashboard/devices',  icon: Smartphone,      label: 'Devices & Activity' },
  { to: '/dashboard/recovery', icon: KeyRound,        label: 'Password & Recovery' },
  { to: '/dashboard/locker',   icon: Lock,            label: 'Secure Locker' },
]

export default function Sidebar({ onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <aside className="flex flex-col h-full w-60" style={{ background: '#0d1117', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(91,164,245,0.1)', border: '1px solid rgba(91,164,245,0.2)' }}>
          <ShieldCheck size={14} className="text-accent-blue" />
        </div>
        <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '0.875rem', color: '#e2e8f0' }}>SecureAuth</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 mb-2.5" style={{ fontSize: '0.65rem', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Navigation</p>
        {mainNav.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/dashboard'}
            onClick={onClose}
            className={({ isActive }) => clsx('nav-item', isActive && 'active')}>
            <Icon size={14} />
            <span className="flex-1">{label}</span>
            <ChevronRight size={11} className="opacity-30" />
          </NavLink>
        ))}

        {user?.role === 'admin' && (
          <>
            <p className="px-3 mb-2.5 mt-5" style={{ fontSize: '0.65rem', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Admin</p>
            <NavLink to="/dashboard/admin" onClick={onClose}
              className={({ isActive }) => clsx('nav-item', isActive && 'active')}>
              <Users size={14} /><span className="flex-1">User Management</span><ChevronRight size={11} className="opacity-30" />
            </NavLink>
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
            style={{ background: 'linear-gradient(135deg,#5ba4f5,#4fd1c5)', color: '#07090f', fontFamily: 'Syne,sans-serif' }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ fontSize: '0.8rem', color: '#e2e8f0', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</p>
            <p style={{ fontSize: '0.7rem', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
          </div>
          <button onClick={handleLogout} title="Logout" className="text-slate-600 hover:text-red-400 transition-colors shrink-0">
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  )
}
