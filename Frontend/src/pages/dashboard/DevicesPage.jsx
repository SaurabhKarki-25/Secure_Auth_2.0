import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Monitor, Smartphone, Globe, Clock, Trash2, LogOut, MapPin, CheckCircle2, RefreshCw } from 'lucide-react'
import { Card, Btn, Alert, Empty } from '../../components/ui'
import toast from 'react-hot-toast'

// Mock device data — replace with real backend data when device tracking routes are added
const mockDevices = [
  { id: '1', name: 'Chrome on Windows', type: 'desktop', ip: '103.21.45.12',  location: 'Mumbai, IN', lastActive: new Date(Date.now() - 5*60000),   current: true  },
  { id: '2', name: 'Safari on iPhone',  type: 'mobile',  ip: '49.36.201.55',  location: 'Delhi, IN',  lastActive: new Date(Date.now() - 2*3600000),  current: false },
  { id: '3', name: 'Firefox on Linux',  type: 'desktop', ip: '45.120.11.200', location: 'Unknown',    lastActive: new Date(Date.now() - 2*86400000), current: false },
]

const mockActivity = [
  { id: '1', action: 'Login',          device: 'Chrome on Windows', ip: '103.21.45.12', time: new Date(Date.now() - 5*60000),   status: 'success' },
  { id: '2', action: 'Password reset', device: 'Chrome on Windows', ip: '103.21.45.12', time: new Date(Date.now() - 1*3600000),  status: 'success' },
  { id: '3', action: 'Login',          device: 'Safari on iPhone',  ip: '49.36.201.55', time: new Date(Date.now() - 2*3600000),  status: 'success' },
  { id: '4', action: 'Failed login',   device: 'Unknown',           ip: '91.108.4.77',  time: new Date(Date.now() - 5*3600000),  status: 'failed' },
  { id: '5', action: 'Login',          device: 'Firefox on Linux',  ip: '45.120.11.200',time: new Date(Date.now() - 2*86400000), status: 'success' },
  { id: '6', action: '2FA verified',   device: 'Chrome on Windows', ip: '103.21.45.12', time: new Date(Date.now() - 3*86400000), status: 'success' },
]

function timeAgo(date) {
  const s = Math.floor((Date.now() - date) / 1000)
  if (s < 60) return 'Just now'
  if (s < 3600) return `${Math.floor(s/60)}m ago`
  if (s < 86400) return `${Math.floor(s/3600)}h ago`
  return `${Math.floor(s/86400)}d ago`
}

export default function DevicesPage() {
  const { user } = useAuth()
  const [devices, setDevices] = useState(mockDevices)
  const [removing, setRemoving] = useState(null)
  const [tab, setTab] = useState('devices')

  const removeDevice = async (id) => {
    setRemoving(id)
    await new Promise(r => setTimeout(r, 800))
    setDevices(d => d.filter(x => x.id !== id))
    toast.success('Device removed')
    setRemoving(null)
  }

  const logoutDevice = async (id) => {
    await new Promise(r => setTimeout(r, 500))
    toast.success('Device session terminated')
    setDevices(d => d.filter(x => x.id !== id))
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="fade-up">
        <p style={{ fontSize: '0.7rem', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Monitoring</p>
        <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '1.5rem', color: '#f1f5f9', marginTop: '0.25rem' }}>Devices &amp; Activity</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl fade-up-1" style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.05)', width: 'fit-content' }}>
        {['devices', 'activity'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-lg capitalize transition-all"
            style={{
              fontFamily: 'Syne,sans-serif', fontWeight: 600, fontSize: '0.8rem',
              background: tab === t ? 'rgba(91,164,245,0.1)' : 'transparent',
              color: tab === t ? '#5ba4f5' : '#475569',
              border: tab === t ? '1px solid rgba(91,164,245,0.2)' : '1px solid transparent',
            }}>
            {t === 'devices' ? 'Known Devices' : 'Login History'}
          </button>
        ))}
      </div>

      {tab === 'devices' && (
        <div className="space-y-3 fade-up-2">
          <Alert type="info">
            <strong>Note:</strong> Device tracking data is local to this session. Your backend records <code>lastLoginIP</code> on every login.
          </Alert>
          {devices.map(dev => (
            <div key={dev.id} className="panel p-4 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: dev.current ? 'rgba(91,164,245,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${dev.current ? 'rgba(91,164,245,0.2)' : 'rgba(255,255,255,0.06)'}` }}>
                {dev.type === 'mobile' ? <Smartphone size={16} className={dev.current ? 'text-accent-blue' : 'text-slate-500'} />
                                       : <Monitor    size={16} className={dev.current ? 'text-accent-blue' : 'text-slate-500'} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 600, fontSize: '0.875rem', color: '#e2e8f0' }}>{dev.name}</span>
                  {dev.current && <span className="badge badge-teal"><span className="w-1.5 h-1.5 rounded-full bg-teal-400 pulse-dot" />Current</span>}
                  {!dev.current && <span className="badge badge-slate">Known</span>}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                  <span className="flex items-center gap-1" style={{ fontSize: '0.7rem', color: '#475569' }}><Globe size={10} />{dev.ip}</span>
                  <span className="flex items-center gap-1" style={{ fontSize: '0.7rem', color: '#475569' }}><MapPin size={10} />{dev.location}</span>
                  <span className="flex items-center gap-1" style={{ fontSize: '0.7rem', color: '#475569' }}><Clock size={10} />{timeAgo(dev.lastActive)}</span>
                </div>
              </div>
              {!dev.current && (
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => logoutDevice(dev.id)} title="Logout device"
                    className="btn btn-sm btn-ghost flex items-center gap-1" style={{ fontSize: '0.7rem' }}>
                    <LogOut size={11} /> Logout
                  </button>
                  <button onClick={() => removeDevice(dev.id)} disabled={removing === dev.id} title="Remove device"
                    className="btn btn-sm btn-danger flex items-center gap-1" style={{ fontSize: '0.7rem' }}>
                    {removing === dev.id ? <RefreshCw size={11} className="spin" /> : <Trash2 size={11} />} Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'activity' && (
        <div className="fade-up-2">
          <Card title="Login History" icon={Clock}>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Action</th><th>Device</th><th>IP Address</th><th>Time</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {mockActivity.map(a => (
                    <tr key={a.id}>
                      <td style={{ color: '#e2e8f0', fontWeight: 500 }}>{a.action}</td>
                      <td>{a.device}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{a.ip}</td>
                      <td>{timeAgo(a.time)}</td>
                      <td>
                        {a.status === 'success'
                          ? <span className="badge badge-green"><CheckCircle2 size={10} />Success</span>
                          : <span className="badge badge-red">Failed</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4">
              <Alert type="info">Login timestamps are tracked by the backend. Connect to <code>/api/users/me</code> <code>lastLogin</code> field for real data.</Alert>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
