import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI, userAPI } from '../services/api'
import toast from 'react-hot-toast'

const Ctx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pending2FA, set2FA] = useState(null)

  // 🔥 Restore session + 2FA
  useEffect(() => {
    const boot = async () => {
      const token = localStorage.getItem('accessToken')
      const pendingRaw = localStorage.getItem('pending2FA')

      // ✅ FIX: parse properly
      if (pendingRaw) {
        try {
          const parsed = JSON.parse(pendingRaw)
          if (parsed?.userId) set2FA(parsed)
        } catch {
          localStorage.removeItem('pending2FA')
        }
      }

      if (!token) {
        setLoading(false)
        return
      }

      try {
        const { data } = await userAPI.me()
        setUser(data.data)
      } catch {
        localStorage.clear()
      } finally {
        setLoading(false)
      }
    }

    boot()
  }, [])

  // ✅ REGISTER
  const register = useCallback(async (form) => {
    const { data } = await authAPI.register(form)
    toast.success(data.message)
    return data
  }, [])

  // ✅ LOGIN (BACKEND COMPATIBLE)
  const login = useCallback(async (creds) => {
    const { data } = await authAPI.login(creds)
    const res = data.data

    // 🔐 2FA REQUIRED
    if (res?.requires2FA) {
      const payload = {
        userId: res.userId,
        type: "otp" // email OTP for login
      }

      set2FA(payload)
      localStorage.setItem('pending2FA', JSON.stringify(payload))

      return { step: "OTP_REQUIRED", userId: res.userId }
    }

    // ✅ NORMAL LOGIN
    if (res?.user) {
      localStorage.setItem('accessToken', res.accessToken)
      localStorage.setItem('refreshToken', res.refreshToken)

      setUser(res.user)

      toast.success(`Welcome back, ${res.user.name || 'User'}!`)
      return { step: "SUCCESS" }
    }

    return {}
  }, [])

  // ✅ VERIFY 2FA (FIXED)
  const verify2FA = useCallback(async (otp, userIdFromRoute) => {
    const stored = localStorage.getItem('pending2FA')

    let fallbackId = null
    if (stored) {
      try {
        fallbackId = JSON.parse(stored)?.userId
      } catch {}
    }

    const userId = userIdFromRoute || pending2FA?.userId || fallbackId

    if (!userId) {
      toast.error('Session expired. Please login again.')
      return
    }

    try {
      const { data } = await authAPI.verify2FA(userId, otp)

      const res = data.data

      localStorage.setItem('accessToken', res.accessToken)
      localStorage.setItem('refreshToken', res.refreshToken)

      setUser(res.user)
      set2FA(null)
      localStorage.removeItem('pending2FA')

      toast.success('2FA verified — welcome back!')
    } catch (e) {
      throw e
    }
  }, [pending2FA])

  // ✅ LOGOUT
  const logout = useCallback(async () => {
    try {
      await authAPI.logout({
        refreshToken: localStorage.getItem('refreshToken')
      })
    } catch {}

    localStorage.clear()
    setUser(null)
    set2FA(null)

    toast.success('Logged out')
  }, [])

  // ✅ REFRESH USER
  const refreshUser = useCallback(async () => {
    try {
      const { data } = await userAPI.me()
      setUser(data.data)
    } catch {}
  }, [])

  return (
    <Ctx.Provider
      value={{
        user,
        setUser,
        loading,
        pending2FA,
        register,
        login,
        verify2FA,
        logout,
        refreshUser
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export const useAuth = () => {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAuth outside AuthProvider')
  return c
}