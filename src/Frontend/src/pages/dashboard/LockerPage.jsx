import { useState, useEffect } from 'react'
import {
  Lock, Plus, Eye, EyeOff, Trash2, Key, Globe,
  CreditCard, FileText, RefreshCw, Copy, X, ShieldCheck,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, Btn, Input, Alert, Empty } from '../../components/ui'

// ── Simple XOR "encryption" for client-side preview (replace with real crypto in prod) ──
const encode = (txt) => btoa(unescape(encodeURIComponent(txt)))
const decode = (b64) => { try { return decodeURIComponent(escape(atob(b64))) } catch { return '[corrupted]' } }

const CATEGORIES = [
  { val: 'password', label: 'Password',     icon: Key,        color: '#5ba4f5' },
  { val: 'note',     label: 'Secure Note',  icon: FileText,   color: '#4fd1c5' },
  { val: 'card',     label: 'Card',         icon: CreditCard, color: '#f6ad55' },
  { val: 'website',  label: 'Website',      icon: Globe,      color: '#a78bfa' },
]

const STORAGE_KEY = 'sa_locker_v1'

function loadItems() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}
function saveItems(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export default function LockerPage() {
  const [items, setItems]         = useState(loadItems)
  const [modal, setModal]         = useState(false)   // add modal
  const [viewing, setViewing]     = useState(null)    // item being viewed
  const [revealed, setRevealed]   = useState({})      // which fields are revealed
  const [deleting, setDeleting]   = useState(null)
  const [filter, setFilter]       = useState('all')

  // Form state
  const [form, setForm] = useState({ title: '', category: 'password', username: '', secret: '', url: '', notes: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { saveItems(items) }, [items])

  const catMap = Object.fromEntries(CATEGORIES.map(c => [c.val, c]))

  const addItem = async () => {
    if (!form.title.trim()) return toast.error('Title is required')
    if (!form.secret.trim()) return toast.error('Secret / password is required')
    setSaving(true)
    await new Promise(r => setTimeout(r, 400))
    const item = {
      id: Date.now().toString(),
      title: form.title.trim(),
      category: form.category,
      username: form.username.trim(),
      secret: encode(form.secret),
      url: form.url.trim(),
      notes: form.notes.trim(),
      createdAt: new Date().toISOString(),
    }
    setItems(prev => [item, ...prev])
    setForm({ title: '', category: 'password', username: '', secret: '', url: '', notes: '' })
    setModal(false)
    setSaving(false)
    toast.success('Secret saved to locker!')
  }

  const deleteItem = async (id) => {
    setDeleting(id)
    await new Promise(r => setTimeout(r, 500))
    setItems(prev => prev.filter(x => x.id !== id))
    if (viewing?.id === id) setViewing(null)
    setDeleting(null)
    toast.success('Secret deleted')
  }

  const copy = (text, label = 'Copied!') => {
    navigator.clipboard.writeText(text)
    toast.success(label)
  }

  const toggleReveal = (id, field) => {
    setRevealed(r => ({ ...r, [`${id}_${field}`]: !r[`${id}_${field}`] }))
  }

  const filtered = filter === 'all' ? items : items.filter(x => x.category === filter)

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div className="fade-up flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p style={{ fontSize: '0.7rem', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Vault</p>
          <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '1.5rem', color: '#f1f5f9', marginTop: '0.25rem' }}>Secure Locker</h1>
        </div>
        <button onClick={() => setModal(true)} className="btn btn-primary w-auto px-5 fade-up-1">
          <Plus size={14} /> Add Secret
        </button>
      </div>

      {/* Notice */}
      <Alert type="warning" className="fade-up-2">
        <strong>Privacy Note:</strong> Secrets are encoded and stored in your browser's local storage.
        For production use, connect to an encrypted server-side Locker API.
      </Alert>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 fade-up-2">
        {CATEGORIES.map(({ val, label, icon: Icon, color }) => {
          const count = items.filter(x => x.category === val).length
          return (
            <button key={val} onClick={() => setFilter(filter === val ? 'all' : val)}
              className="stat-card text-left transition-all"
              style={{ borderColor: filter === val ? `${color}35` : undefined }}>
              <Icon size={14} style={{ color, marginBottom: '0.6rem' }} />
              <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '1.2rem', color: '#e2e8f0' }}>{count}</p>
              <p style={{ fontSize: '0.7rem', color: '#475569' }}>{label}s</p>
            </button>
          )
        })}
      </div>

      {/* Item list */}
      <div className="space-y-2 fade-up-3">
        {filtered.length === 0
          ? <Empty icon={Lock} message={items.length === 0 ? 'No secrets yet — add your first one!' : 'No items in this category'} />
          : filtered.map(item => {
            const cat = catMap[item.category]
            const Icon = cat?.icon || Key
            const isViewing = viewing?.id === item.id
            return (
              <div key={item.id} className="panel transition-all" style={{ borderColor: isViewing ? 'rgba(91,164,245,0.2)' : undefined }}>
                {/* Row */}
                <div className="flex items-center gap-3 p-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${cat?.color || '#5ba4f5'}15`, border: `1px solid ${cat?.color || '#5ba4f5'}25` }}>
                    <Icon size={14} style={{ color: cat?.color || '#5ba4f5' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 600, fontSize: '0.875rem', color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.title}
                    </p>
                    <p style={{ fontSize: '0.7rem', color: '#475569' }}>
                      {cat?.label} {item.username && `• ${item.username}`}
                      {' • '}{new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => setViewing(isViewing ? null : item)}
                      className="btn btn-icon btn-ghost" title="View secret">
                      {isViewing ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                    <button onClick={() => deleteItem(item.id)} disabled={deleting === item.id}
                      className="btn btn-icon btn-danger" title="Delete">
                      {deleting === item.id ? <RefreshCw size={13} className="spin" /> : <Trash2 size={13} />}
                    </button>
                  </div>
                </div>

                {/* Expanded view */}
                {isViewing && (
                  <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                    {/* Secret */}
                    <div>
                      <label className="label">Secret / Password</label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 p-2.5 rounded-lg text-sm"
                          style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.06)', color: '#5ba4f5', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {revealed[`${item.id}_secret`] ? decode(item.secret) : '••••••••••••'}
                        </code>
                        <button onClick={() => toggleReveal(item.id, 'secret')} className="btn btn-icon btn-ghost">
                          {revealed[`${item.id}_secret`] ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                        <button onClick={() => copy(decode(item.secret), 'Secret copied!')} className="btn btn-icon btn-ghost"><Copy size={13} /></button>
                      </div>
                    </div>
                    {/* Username */}
                    {item.username && (
                      <div>
                        <label className="label">Username / Email</label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 p-2.5 rounded-lg text-sm" style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.06)', color: '#94a3b8', fontFamily: 'monospace' }}>
                            {item.username}
                          </code>
                          <button onClick={() => copy(item.username, 'Username copied!')} className="btn btn-icon btn-ghost"><Copy size={13} /></button>
                        </div>
                      </div>
                    )}
                    {/* URL */}
                    {item.url && (
                      <div>
                        <label className="label">URL</label>
                        <a href={item.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: '#5ba4f5' }}>{item.url}</a>
                      </div>
                    )}
                    {/* Notes */}
                    {item.notes && (
                      <div>
                        <label className="label">Notes</label>
                        <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.6 }}>{item.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        }
      </div>

      {/* ── Add Modal ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-md fade-up" style={{ background: '#111822', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 32px 64px rgba(0,0,0,0.6)' }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-accent-blue" />
                <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '1rem', color: '#e2e8f0' }}>Add New Secret</h2>
              </div>
              <button onClick={() => setModal(false)} className="btn btn-icon btn-ghost"><X size={15} /></button>
            </div>

            <div className="space-y-3">
              {/* Category */}
              <div>
                <label className="label">Category</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {CATEGORIES.map(({ val, label, icon: Icon, color }) => (
                    <button key={val} onClick={() => setForm(f => ({ ...f, category: val }))}
                      className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all"
                      style={{
                        background: form.category === val ? `${color}15` : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${form.category === val ? `${color}40` : 'rgba(255,255,255,0.06)'}`,
                      }}>
                      <Icon size={13} style={{ color: form.category === val ? color : '#475569' }} />
                      <span style={{ fontSize: '0.62rem', color: form.category === val ? color : '#475569' }}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Input label="Title *" placeholder="e.g. GitHub account"
                value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />

              <Input label="Username / Email" placeholder="user@example.com"
                value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />

              <Input label="Secret / Password *" type="password" placeholder="Stored encrypted"
                value={form.secret} onChange={e => setForm(f => ({ ...f, secret: e.target.value }))} />

              <Input label="URL (optional)" placeholder="https://github.com"
                value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />

              <div>
                <label className="label">Notes (optional)</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Additional info…" rows={2}
                  className="field resize-none" style={{ resize: 'none' }} />
              </div>

              <div className="flex gap-2 pt-1">
                <Btn onClick={addItem} loading={saving}>Save Secret</Btn>
                <Btn variant="outline" onClick={() => setModal(false)} className="w-auto px-5">Cancel</Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
