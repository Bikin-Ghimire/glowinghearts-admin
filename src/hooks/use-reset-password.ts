// hooks/use-reset-password.ts
'use client'
import { useState } from 'react'

export function useResetPassword(key1: string, key2: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function submit(newPassword: string): Promise<{ ok: boolean; message?: string }> {
    setLoading(true)
    setError(null)            // ✅ clear any stale error
    setSuccess(false)         // optional: reset before attempt
    try {
      const res = await fetch(`/api/pwd/reset/${key1}/${key2}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ VC_Pwd: newPassword }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok || data?.err_Code !== 0) {
        const msg = data?.message || `Error ${res.status}`
        setError(msg)
        setSuccess(false)
        return { ok: false, message: msg }
      }

      setSuccess(true)
      return { ok: true }
    } catch {
      const msg = 'Network error. Please try again.'
      setError(msg)
      setSuccess(false)
      return { ok: false, message: msg }
    } finally {
      setLoading(false)
    }
  }

  return { loading, error, success, submit }
}