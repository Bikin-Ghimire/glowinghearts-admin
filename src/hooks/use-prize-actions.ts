// src/hooks/use-prize-actions.ts
'use client'

import { useSession } from 'next-auth/react'
import { useState } from 'react'
import { getTokenFromSession } from './use-session-token' // <- your existing helper

export function usePrizeActions() {
    const { data: session } = useSession()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const callApi = async (path: string, prizeId: string, body?: any) => {
    setError(null)
    setLoadingId(prizeId)
    try {
      const token = await getTokenFromSession(session)
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/${path}/${prizeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(text || `Request failed (${res.status})`)
      }
      return true
    } catch (e: any) {
      setError(e?.message || 'Something went wrong')
      return false
    } finally {
      setLoadingId(null)
    }
  }

  const markPaidOut = (prizeId: string, VC_Note: string) => callApi('Prize/PaidOut', prizeId, { VC_Note })

  const markDonated = (prizeId: string, VC_Note: string) => callApi('Prize/Donate', prizeId, { VC_Note })

  return { markPaidOut, markDonated, loadingId, error }
}
