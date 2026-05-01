import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading, pending2FA } = useAuth()

  if (loading) return null

  // 🔐 If 2FA pending → go to verification
  if (pending2FA) {
    return <Navigate to="/verify-otp" replace />
  }

  // ❌ Not logged in
  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}