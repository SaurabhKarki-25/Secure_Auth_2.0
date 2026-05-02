import axios from 'axios'

// ─────────────────────────────────────────
// BASE CONFIG (FIXED)
// ─────────────────────────────────────────
const BASE =
  import.meta.env.VITE_API_URL ||
  window.location.origin   // ✅ fallback (IMPORTANT for Render)

// Always use /api once
const API = axios.create({
  baseURL: `${BASE}/api`,
  timeout: 60000 , // 60 seconds,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

// ─────────────────────────────────────────
// TOKEN HELPERS
// ─────────────────────────────────────────
const getAccess = () => localStorage.getItem('accessToken')
const getRefresh = () => localStorage.getItem('refreshToken')

const setTokens = (at, rt) => {
  if (at) localStorage.setItem('accessToken', at)
  if (rt) localStorage.setItem('refreshToken', rt)
}

const clearSession = () => {
  localStorage.clear()
  window.location.href = '/login'
}

// ─────────────────────────────────────────
// REQUEST INTERCEPTOR
// ─────────────────────────────────────────
API.interceptors.request.use(
  (config) => {
    const token = getAccess()
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ─────────────────────────────────────────
// RESPONSE INTERCEPTOR (FIXED)
// ─────────────────────────────────────────
let refreshing = false
let queue = []

const flushQueue = (error, token = null) => {
  queue.forEach(p => {
    if (error) p.reject(error)
    else p.resolve(token)
  })
  queue = []
}

API.interceptors.response.use(
  res => res,
  async (error) => {
    const original = error.config

    const isExpired =
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED'

    if (isExpired && !original._retry) {

      if (refreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return API(original)
        })
      }

      original._retry = true
      refreshing = true

      try {
        const refreshToken = getRefresh()
        if (!refreshToken) throw new Error('No refresh token')

        const { data } = await axios.post(
          `${BASE}/api/auth/refresh-token`,
          { refreshToken }
        )

        const newAccess = data.data.accessToken
        const newRefresh = data.data.refreshToken

        setTokens(newAccess, newRefresh)
        flushQueue(null, newAccess)

        original.headers.Authorization = `Bearer ${newAccess}`
        return API(original)

      } catch (err) {
        flushQueue(err)
        clearSession()
        return Promise.reject(err)
      } finally {
        refreshing = false
      }
    }

    return Promise.reject(error)
  }
)

// ─────────────────────────────────────────
// ERROR HANDLER
// ─────────────────────────────────────────
export const errMsg = (e) =>
  e?.response?.data?.errors?.map(x => x.message).join(', ')
  || e?.response?.data?.message
  || (e?.message === 'Network Error'
      ? 'Cannot reach backend server'
      : e?.message)
  || 'Something went wrong'

// ─────────────────────────────────────────
// APIs
// ─────────────────────────────────────────
export const authAPI = {
  register:       (d) => API.post('/auth/register', d),
  login:          (d) => API.post('/auth/login', d),
  verifyEmail:    (email, otp) => API.post('/auth/verify-email', { email, otp }),
  forgotPassword: (email) => API.post('/auth/forgot-password', { email }),
  verifyOTP:      (email, otp) => API.post('/auth/verify-otp', { email, otp }),
  resetPassword:  (tok, pwd) => API.post('/auth/reset-password', { resetToken: tok, newPassword: pwd }),
  resendOTP:      (email, type) => API.post('/auth/resend-otp', { email, type }),
  verify2FA:      (userId, otp) => API.post('/auth/verify-2fa', { userId, otp }),
  logout:         (data) => API.post('/auth/logout', data),
}

export const userAPI = {
  me:          () => API.get('/users/me'),
  updateMe:    (d) => API.patch('/users/me', d),
  enable2FA:   () => API.post('/users/enable-2fa'),
  disable2FA:  () => API.post('/users/disable-2fa'),
  allUsers:    (p = 1, l = 10) => API.get(`/users/all?page=${p}&limit=${l}`),
  deactivate:  (id) => API.delete(`/users/${id}`),
}

// ✅ HEALTH FIX
export const healthAPI = () => axios.get(`${BASE}/health`)

export default API