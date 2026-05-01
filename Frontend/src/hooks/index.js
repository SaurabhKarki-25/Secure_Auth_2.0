import { useState, useEffect, useRef, useCallback } from 'react'

// Countdown timer for OTP resend
export function useCountdown(initial = 60) {
  const [secs, setSecs] = useState(0)
  const t = useRef(null)
  const start = (s = initial) => { clearInterval(t.current); setSecs(s) }
  useEffect(() => {
    if (secs <= 0) return
    t.current = setInterval(() => setSecs(s => { if (s <= 1) { clearInterval(t.current); return 0 } return s-1 }), 1000)
    return () => clearInterval(t.current)
  }, [secs > 0])
  return { secs, start, active: secs > 0 }
}

// Async action with loading/error
export function useAsync() {
  const [loading, setLoading] = useState(false)
  const run = useCallback(async (fn) => {
    setLoading(true)
    try { return await fn() }
    finally { setLoading(false) }
  }, [])
  return { loading, run }
}

// Local storage state
export function useLocalStorage(key, def) {
  const [val, setVal] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : def }
    catch { return def }
  })
  const set = useCallback(v => {
    setVal(v)
    localStorage.setItem(key, JSON.stringify(v))
  }, [key])
  return [val, set]
}
