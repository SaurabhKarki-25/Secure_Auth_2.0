import { Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: '#07090f' }}>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6"
        style={{ background: 'rgba(91,164,245,0.1)', border: '1px solid rgba(91,164,245,0.2)' }}>
        <ShieldCheck size={26} className="text-accent-blue" />
      </div>
      <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '5rem', color: '#1e293b', lineHeight: 1 }}>404</p>
      <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '1.5rem', color: '#f1f5f9', marginTop: '0.5rem', marginBottom: '0.75rem' }}>Page not found</h1>
      <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '2rem' }}>The page you're looking for doesn't exist.</p>
      <div className="flex gap-3">
        <Link to="/"          className="btn btn-primary w-auto px-6">Go Home</Link>
        <Link to="/dashboard" className="btn btn-outline w-auto px-6">Dashboard</Link>
      </div>
    </div>
  )
}
