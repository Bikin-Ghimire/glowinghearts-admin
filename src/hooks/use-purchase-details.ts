// hooks/use-purchase-details.ts
'use client'

import { useSession } from 'next-auth/react'
import { useCallback, useRef, useState } from 'react'
import { GetPurchasePayload, getPurchaseById } from '@/lib/purchases'

type Status = 'idle' | 'loading' | 'ready' | 'error'

export function usePurchaseDetails() {
  const { data: session } = useSession()
  const cacheRef = useRef<Record<string, GetPurchasePayload>>({})
  const [statusById, setStatusById] = useState<Record<string, Status>>({})
  const [errorById, setErrorById] = useState<Record<string, string | null>>({})

  const get = useCallback(async (purchaseId: string): Promise<GetPurchasePayload | null> => {
    if (!session) return null
    if (cacheRef.current[purchaseId]) return cacheRef.current[purchaseId]
    return refresh(purchaseId)
  }, [session])

  const refresh = useCallback(async (purchaseId: string): Promise<GetPurchasePayload | null> => {
    if (!session) return null

    setStatusById((s) => ({ ...s, [purchaseId]: 'loading' }))
    setErrorById((e) => ({ ...e, [purchaseId]: null }))
    try {
      const data = await getPurchaseById(session, purchaseId)
      cacheRef.current[purchaseId] = data
      setStatusById((s) => ({ ...s, [purchaseId]: 'ready' }))
      return data
    } catch (err: any) {
      setStatusById((s) => ({ ...s, [purchaseId]: 'error' }))
      setErrorById((e) => ({ ...e, [purchaseId]: err?.message ?? 'Failed to load' }))
      return null
    }
  }, [session])

  const peek = useCallback((purchaseId: string) => cacheRef.current[purchaseId] ?? null, [])
  const status = useCallback((purchaseId: string): Status => statusById[purchaseId] ?? 'idle', [statusById])
  const error = useCallback((purchaseId: string) => errorById[purchaseId] ?? null, [errorById])

  return { get, refresh, peek, status, error }
}