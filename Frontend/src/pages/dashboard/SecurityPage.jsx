import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { userAPI, errMsg } from '../../services/api'
import {
  Shield, Key, Mail, AlertTriangle, CheckCircle2,
  QrCode, Copy, Eye, EyeOff, RefreshCw, Info,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, Toggle, Btn, OTPInput, Alert, Input } from '../../components/ui'

// ─── Mock TOTP / Backup codes (UI layer — hook to real backend when you add TOTP routes) ──
const MOCK_QR = 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=otpauth://totp/SecureAuth:user@example.com?secret=BASE32SECRET&issuer=SecureAuth'
const genBackupCodes = () => Array.from({ length: 8 }, () =>
  Math.random().toString(36).slice(2, 7).toUpperCase() + '-' + Math.random().toString(36).slice(2, 7).toUpperCase()
)

export default function SecurityPage() {
  const { user, refreshUser } = useAuth()
  const [toggling, setToggling] = useState(false)

  // TOTP setup state (UI mock — connect to backend TOTP routes when available)
  const [showQR, setShowQR] = useState(false)
  const [totpCode, setTotpCode] = useState('')
  const [totpVerifying, setTotpVerifying] = useState(false)
  const [totpEnabled, setTotpEnabled] = useState(false)

  // Backup codes
  const [backupCodes, setBackupCodes] = useState([])
  const [showCodes, setShowCodes] = useState(false)
  const [regenLoading, setRegenLoading] = useState(false)

  // Primary method selection
  const [primaryMethod, setPrimaryMethod] = useState('otp')

  // ── Toggle Email OTP (2FA) ────────────────────────────────────────────────
  const toggle2FA = async () => {
    setToggling(true)
    try {
      if (user?.twoFactorEnabled) {
        await userAPI.disable2FA()
        toast.success('Email OTP disabled')
      } else {
        await userAPI.enable2FA()
        toast.success('Email OTP enabled — you\'ll receive a code on next login')
      }
      await refreshUser()
    } catch (e) { toast.error(errMsg(e)) }
    finally { setToggling(false) }
  }

  // ── TOTP verify (UI mock) ─────────────────────────────────────────────────
  const verifyTOTP = async () => {
    if (totpCode.length < 6) return toast.error('Enter 6-digit TOTP code')
    setTotpVerifying(true)
    await new Promise(r => setTimeout(r, 1000)) // simulate
    if (totpCode === '123456' || totpCode.length === 6) {
      setTotpEnabled(true); setShowQR(false)
      toast.success('TOTP enabled! Google Authenticator is set up.')
    } else { toast.error('Invalid code — try again') }
    setTotpVerifying(false); setTotpCode('')
  }

  // ── Backup codes ──────────────────────────────────────────────────────────
  const generateCodes = () => {
    const codes = genBackupCodes()
    setBackupCodes(codes); setShowCodes(true)
    toast.success('New backup codes generated — save them now!')
  }

  const copyCode = (c) => { navigator.clipboard.writeText(c); toast.success('Copied!') }

  const copyAll = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'))
    toast.success('All codes copied!')
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="fade-up">
        <p style={{ fontSize: '0.7rem', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Settings</p>
        <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '1.5rem', color: '#f1f5f9', marginTop: '0.25rem' }}>Security Settings</h1>
      </div>

      {/* ── Auth Methods ── */}
      <Card title="Authentication Methods" icon={Shield} className="fade-up-1">
        {/* Email OTP */}
        <div className="flex items-start justify-between gap-4 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Mail size={13} className="text-accent-blue" />
              <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 600, fontSize: '0.875rem', color: '#e2e8f0' }}>Email OTP</span>
              {user?.twoFactorEnabled && <span className="badge badge-green">Active</span>}
            </div>
            <p style={{ fontSize: '0.75rem', color: '#475569' }}>Receive a one-time code via email each time you log in.</p>
          </div>
          <Toggle on={!!user?.twoFactorEnabled} onChange={toggle2FA} disabled={toggling} />
        </div>

        {/* TOTP (Google Authenticator) */}
        <div className="flex items-start justify-between gap-4 pt-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Key size={13} style={{ color: '#f6ad55' }} />
              <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 600, fontSize: '0.875rem', color: '#e2e8f0' }}>TOTP (Authenticator App)</span>
              {totpEnabled && <span className="badge badge-green">Active</span>}
            </div>
            <p style={{ fontSize: '0.75rem', color: '#475569' }}>Use Google Authenticator or Authy to generate codes offline.</p>
          </div>
          <Toggle on={totpEnabled} onChange={v => { if (!v) { setTotpEnabled(false); toast.success('TOTP disabled') } else setShowQR(true) }} />
        </div>
      </Card>

      {/* ── Primary Method ── */}
      <Card title="Primary Auth Method" icon={Key} className="fade-up-2">
        <p style={{ fontSize: '0.75rem', color: '#475569', marginBottom: '1rem' }}>Choose which method is prompted first after login.</p>
        <div className="space-y-2">
          {[
            { val: 'otp',  label: 'OTP via Email',        icon: Mail, color: '#5ba4f5', disabled: !user?.twoFactorEnabled },
            { val: 'totp', label: 'TOTP (Authenticator)', icon: Key,  color: '#f6ad55', disabled: !totpEnabled },
          ].map(({ val, label, icon: Icon, color, disabled }) => (
            <button key={val} onClick={() => !disabled && setPrimaryMethod(val)}
              disabled={disabled}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
              style={{
                background: primaryMethod === val ? `${color}12` : 'rgba(255,255,255,0.02)',
                border: `1px solid ${primaryMethod === val ? `${color}35` : 'rgba(255,255,255,0.05)'}`,
                opacity: disabled ? 0.4 : 1, cursor: disabled ? 'not-allowed' : 'pointer',
              }}>
              <div className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0"
                style={{ borderColor: primaryMethod === val ? color : '#334155' }}>
                {primaryMethod === val && <span className="w-1.5 h-1.5 rounded-full block" style={{ background: color }} />}
              </div>
              <Icon size={13} style={{ color }} />
              <span style={{ fontSize: '0.8rem', color: '#e2e8f0' }}>{label}</span>
              {disabled && <span className="badge badge-slate ml-auto">Not set up</span>}
            </button>
          ))}
        </div>
        {(user?.twoFactorEnabled || totpEnabled) && (
          <Btn className="mt-4" onClick={() => toast.success(`Primary method set to ${primaryMethod.toUpperCase()}`)}>
            Save Method
          </Btn>
        )}
      </Card>

      {/* ── TOTP Setup ── */}
      {showQR && (
        <Card title="Setup TOTP" icon={QrCode} iconColor="text-amber-400" className="fade-up-3">
          <div className="space-y-4">
            <Alert type="warning">Scan this QR code in Google Authenticator or Authy, then enter the 6-digit code to verify.</Alert>
            <div className="flex justify-center">
              <div className="p-3 rounded-xl" style={{ background: '#fff' }}>
                <img src={MOCK_QR} alt="TOTP QR Code" className="w-44 h-44 block" />
              </div>
            </div>
            <div>
              <p className="label mb-2">Manual entry key</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2.5 rounded-lg text-xs" style={{ background: '#0d1117', color: '#5ba4f5', border: '1px solid rgba(255,255,255,0.06)', fontFamily: 'monospace' }}>
                  BASE32SECRETKEYEXAMPLE
                </code>
                <button onClick={() => { navigator.clipboard.writeText('BASE32SECRETKEYEXAMPLE'); toast.success('Key copied!') }}
                  className="btn btn-icon btn-outline"><Copy size={13} /></button>
              </div>
            </div>
            <div>
              <p className="label mb-2">Verify code from app</p>
              <OTPInput length={6} value={totpCode} onChange={setTotpCode} />
            </div>
            <div className="flex gap-2">
              <Btn onClick={verifyTOTP} loading={totpVerifying} disabled={totpCode.length < 6}>Verify &amp; Enable TOTP</Btn>
              <Btn variant="outline" onClick={() => { setShowQR(false); setTotpCode('') }} className="w-auto px-5">Cancel</Btn>
            </div>
          </div>
        </Card>
      )}

      {/* ── Backup Codes ── */}
      <Card title="Backup Codes" icon={Key} iconColor="text-purple-400" className="fade-up-4"
        action={
          <Btn variant="outline" size="sm" className="w-auto" onClick={generateCodes}>
            <RefreshCw size={12} /> {backupCodes.length ? 'Regenerate' : 'Generate'}
          </Btn>
        }>
        <p style={{ fontSize: '0.75rem', color: '#475569', marginBottom: '1rem' }}>
          Backup codes let you regain account access if you lose your authenticator. Each code can only be used once.
        </p>
        {backupCodes.length === 0
          ? <Alert type="info">Generate backup codes to enable account recovery if you lose 2FA access.</Alert>
          : (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span style={{ fontSize: '0.75rem', color: '#475569' }}>{backupCodes.length} codes available — store these safely</span>
                <div className="flex gap-2">
                  <button onClick={() => setShowCodes(s => !s)} className="btn btn-ghost btn-sm flex items-center gap-1">
                    {showCodes ? <EyeOff size={12} /> : <Eye size={12} />} {showCodes ? 'Hide' : 'Show'}
                  </button>
                  <button onClick={copyAll} className="btn btn-ghost btn-sm flex items-center gap-1"><Copy size={12} /> Copy all</button>
                </div>
              </div>
              {showCodes && (
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((c, i) => (
                    <div key={i} onClick={() => copyCode(c)}
                      className="flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all"
                      style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.06)', fontFamily: 'monospace', fontSize: '0.75rem', color: '#94a3b8' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(91,164,245,0.25)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}>
                      <span>{c}</span>
                      <Copy size={10} style={{ color: '#334155' }} />
                    </div>
                  ))}
                </div>
              )}
              <Alert type="warning">These codes will only be shown once. Save them in a password manager.</Alert>
            </div>
          )
        }
      </Card>

      {/* ── Security info ── */}
      <Card title="Security Info" icon={Info} className="fade-up-5">
        <div className="space-y-2.5">
          {[
            ['Last login',       user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'First login'],
            ['Last login IP',    user?.lastLoginIP || 'N/A'],
            ['Account status',   'Active'],
            ['Login attempts',   '0 failed'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize: '0.75rem', color: '#475569' }}>{k}</span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{v}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
