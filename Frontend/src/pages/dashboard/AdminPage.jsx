import { useEffect, useState } from 'react'
import { userAPI, errMsg } from '../../services/api'
import {
  Users, Search, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, Shield, Trash2, RefreshCw, UserX,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, Btn, Empty, Alert } from '../../components/ui'

export default function AdminPage() {
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage]       = useState(1)
  const [total, setTotal]     = useState(0)
  const [pages, setPages]     = useState(1)
  const [search, setSearch]   = useState('')
  const [removing, setRemoving] = useState(null)

  const load = async (p = 1) => {
    setLoading(true)
    try {
      const { data } = await userAPI.allUsers(p, 10)
      setUsers(data.data.users); setTotal(data.data.total)
      setPages(data.data.pages); setPage(p)
    } catch (e) { toast.error(errMsg(e)) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const deactivate = async (id, name) => {
    if (!window.confirm(`Deactivate ${name}? They won't be able to log in.`)) return
    setRemoving(id)
    try { await userAPI.deactivate(id); toast.success(`${name} deactivated`); load(page) }
    catch (e) { toast.error(errMsg(e)) }
    finally { setRemoving(null) }
  }

  const filtered = search
    ? users.filter(u => u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))
    : users

  const roleColor = { admin: '#f6ad55', moderator: '#5ba4f5', user: '#4fd1c5' }

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="fade-up flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p style={{ fontSize: '0.7rem', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Administration</p>
          <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '1.5rem', color: '#f1f5f9', marginTop: '0.25rem' }}>User Management</h1>
          <p style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.25rem' }}>{total} total active users</p>
        </div>
        <button onClick={() => load(page)} className="btn btn-outline btn-sm flex items-center gap-1.5 w-auto">
          <RefreshCw size={12} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {/* Search */}
      <div className="fade-up-1 relative max-w-xs">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email…" className="field pl-9 text-xs" />
      </div>

      {/* Table */}
      <Card className="fade-up-2 overflow-hidden" style={{ padding: 0 }}>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Email Verified</th>
                <th>2FA</th>
                <th>Last Login</th>
                <th>Joined</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="w-6 h-6 rounded-full border-2 spin mx-auto" style={{ borderColor: 'rgba(91,164,245,0.2)', borderTopColor: '#5ba4f5' }} />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7}><Empty icon={Users} message="No users found" /></td></tr>
              ) : filtered.map(u => (
                <tr key={u._id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ background: 'linear-gradient(135deg,#5ba4f5,#4fd1c5)', color: '#07090f', fontFamily: 'Syne,sans-serif' }}>
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontSize: '0.8rem', color: '#e2e8f0', fontWeight: 500 }}>{u.name}</p>
                        <p style={{ fontSize: '0.68rem', color: '#475569' }}>{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge" style={{
                      background: `${roleColor[u.role] || '#5ba4f5'}15`,
                      color: roleColor[u.role] || '#5ba4f5',
                      border: `1px solid ${roleColor[u.role] || '#5ba4f5'}30`,
                    }}>
                      {u.role === 'admin' && <Shield size={9} />}
                      {u.role}
                    </span>
                  </td>
                  <td>
                    {u.isEmailVerified
                      ? <CheckCircle2 size={14} style={{ color: '#34d399' }} />
                      : <XCircle size={14} style={{ color: '#475569' }} />
                    }
                  </td>
                  <td>
                    {u.twoFactorEnabled
                      ? <CheckCircle2 size={14} style={{ color: '#f6ad55' }} />
                      : <XCircle size={14} style={{ color: '#475569' }} />
                    }
                  </td>
                  <td>{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : '—'}</td>
                  <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                  <td>
                    <button
                      onClick={() => deactivate(u._id, u.name)}
                      disabled={removing === u._id || u.role === 'admin'}
                      title={u.role === 'admin' ? 'Cannot deactivate admin' : 'Deactivate user'}
                      className="btn btn-sm btn-danger flex items-center gap-1"
                      style={{ opacity: u.role === 'admin' ? 0.3 : 1 }}>
                      {removing === u._id
                        ? <RefreshCw size={11} className="spin" />
                        : <UserX size={11} />
                      }
                      {removing === u._id ? '…' : 'Deactivate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <p style={{ fontSize: '0.75rem', color: '#475569' }}>Page {page} of {pages} • {total} users</p>
            <div className="flex gap-1">
              <button onClick={() => load(page-1)} disabled={page===1||loading} className="btn btn-icon btn-ghost">
                <ChevronLeft size={14} />
              </button>
              <button onClick={() => load(page+1)} disabled={page===pages||loading} className="btn btn-icon btn-ghost">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </Card>

      <Alert type="warning" className="fade-up-3">
        <strong>Admin only:</strong> This page calls <code>GET /api/users/all</code> which requires admin role. Deactivated users cannot log in.
      </Alert>
    </div>
  )
}
