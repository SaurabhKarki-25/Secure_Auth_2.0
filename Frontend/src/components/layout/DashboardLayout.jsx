import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu, X, Bell } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Sidebar from './Sidebar'

export default function DashboardLayout() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#07090f' }}>
      {/* Desktop sidebar */}
      <div className="hidden md:flex shrink-0"><Sidebar /></div>

      {/* Mobile sidebar overlay */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 z-10"><Sidebar onClose={() => setOpen(false)} /></div>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-13 flex items-center justify-between px-5 shrink-0"
          style={{ height: '52px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(13,17,23,0.8)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 30 }}>
          <button onClick={() => setOpen(true)} className="md:hidden text-slate-500 hover:text-slate-200 transition-colors">
            <Menu size={18} />
          </button>
          <div />
          <div className="flex items-center gap-2">
            <button className="btn btn-icon btn-ghost" title="Notifications"><Bell size={14} /></button>
            <div className="flex items-center gap-2 pl-2" style={{ borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: 'linear-gradient(135deg,#5ba4f5,#4fd1c5)', color: '#07090f', fontFamily: 'Syne,sans-serif' }}>
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p style={{ fontSize: '0.8rem', color: '#e2e8f0', fontWeight: 500 }}>{user?.name}</p>
                <p style={{ fontSize: '0.65rem', color: '#475569' }}>{user?.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-5 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
