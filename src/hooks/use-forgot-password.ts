'use client'

import { useState } from 'react'

export function useForgotPassword() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  async function submit(email: string) {
    setLoading(true)
    setError(null)
    setSuccessMsg(null)
    try {
      const res = await fetch('/api/pwd/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ VC_Email: email }),
      })
      const data = await res.json()
      if (!res.ok || data.err_Code !== 0) {
        setError(data?.message || 'Failed to start password reset.')
      } else {
        // Your backend also sends email; we just show a user-friendly note.
        setSuccessMsg('If that email exists, a reset link has been sent.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return { loading, error, successMsg, submit }
}