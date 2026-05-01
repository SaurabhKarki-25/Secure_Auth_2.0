import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

// Layout
import DashboardLayout from './components/layout/DashboardLayout'

// Public pages
import LandingPage from './pages/LandingPage'
import NotFoundPage from './pages/NotFoundPage'

// Auth pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import VerifyEmailPage from './pages/auth/VerifyEmailPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import VerifyOTPPage from './pages/auth/VerifyOTPPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import Verify2FAPage from './pages/auth/Verify2FAPage'

// Dashboard pages
import DashboardHome from './pages/dashboard/DashboardHome'
import SecurityPage from './pages/dashboard/SecurityPage'
import DevicesPage from './pages/dashboard/DevicesPage'
import RecoveryPage from './pages/dashboard/RecoveryPage'
import LockerPage from './pages/dashboard/LockerPage'
import AdminPage from './pages/dashboard/AdminPage'


// ── Loader ─────────────────────────
function Loader() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#07090f' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 spin"
          style={{ borderColor: 'rgba(91,164,245,0.15)', borderTopColor: '#5ba4f5' }} />
        <p style={{ fontSize: '0.8rem', color: '#334155' }}>Authenticating…</p>
      </div>
    </div>
  )
}


// 🔥 Helper: choose correct 2FA page
function get2FARoute(pending2FA) {
  if (!pending2FA) return null
  return pending2FA.type === 'totp' ? '/verify-2fa' : '/verify-2fa'
  // NOTE: backend uses email OTP → always verify-2fa
}


// ── Private Route ───────────────────
function PrivateRoute({ children }) {
  const { user, loading, pending2FA } = useAuth()

  if (loading) return <Loader />

  if (pending2FA) {
    return <Navigate to={get2FARoute(pending2FA)} replace />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}


// ── Admin Route ─────────────────────
function AdminRoute({ children }) {
  const { user, loading, pending2FA } = useAuth()

  if (loading) return <Loader />

  if (pending2FA) {
    return <Navigate to={get2FARoute(pending2FA)} replace />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}


// ── Public Route ────────────────────
function PublicRoute({ children }) {
  const { user, loading, pending2FA } = useAuth()

  if (loading) return <Loader />

  if (pending2FA) {
    return <Navigate to={get2FARoute(pending2FA)} replace />
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}


// ── 2FA Route ───────────────────────
function TwoFARoute({ children }) {
  const { pending2FA, loading } = useAuth()

  if (loading) return <Loader />

  if (!pending2FA) {
    return <Navigate to="/login" replace />
  }

  return children
}


// ── App ─────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <Routes>

        {/* Public */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth */}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* ❗ Forgot Password OTP */}
        <Route path="/verify-otp" element={<VerifyOTPPage />} />

        {/* 🔐 Login 2FA */}
        <Route path="/verify-2fa" element={
          <TwoFARoute>
            <Verify2FAPage />
          </TwoFARoute>
        } />

        {/* Dashboard */}
        <Route path="/dashboard" element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }>
          <Route index element={<DashboardHome />} />
          <Route path="security" element={<SecurityPage />} />
          <Route path="devices" element={<DevicesPage />} />
          <Route path="recovery" element={<RecoveryPage />} />
          <Route path="locker" element={<LockerPage />} />
          <Route path="admin" element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          } />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />

      </Routes>
    </AuthProvider>
  )
}