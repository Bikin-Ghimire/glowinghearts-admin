// hooks/use-ticket-details.ts
'use client'

import { useSession } from 'next-auth/react'
import { useCallback, useRef, useState } from 'react'
import { getTicketById, type TicketRecord } from '@/lib/tickets'

type Status = 'idle' | 'loading' | 'ready' | 'error'

export function useTicketDetails(raffleId: string) {
  const { data: session } = useSession()
  const cacheRef = useRef<Record<string, TicketRecord>>({})
  const [statusById, setStatusById] = useState<Record<string, Status>>({})
  const [errorById, setErrorById] = useState<Record<string, string | null>>({})

  const get = useCallback(
    async (ticketId: string): Promise<TicketRecord | null> => {
      if (!session || !raffleId) return null
      if (cacheRef.current[ticketId]) return cacheRef.current[ticketId]
      setStatusById((s) => ({ ...s, [ticketId]: 'loading' }))
      setErrorById((e) => ({ ...e, [ticketId]: null }))
      try {
        const data = await getTicketById(session, raffleId, ticketId)
        cacheRef.current[ticketId] = data
        setStatusById((s) => ({ ...s, [ticketId]: 'ready' }))
        return data
      } catch (err: any) {
        setStatusById((s) => ({ ...s, [ticketId]: 'error' }))
        setErrorById((e) => ({ ...e, [ticketId]: err?.message ?? 'Failed to load ticket' }))
        return null
      }
    },
    [session, raffleId]
  )

  const peek = useCallback((ticketId: string) => cacheRef.current[ticketId] ?? null, [])
  const status = useCallback((ticketId: string): Status => statusById[ticketId] ?? 'idle', [statusById])
  const error = useCallback((ticketId: string) => errorById[ticketId] ?? null, [errorById])

  return { get, peek, status, error }
}