// hooks/use-users-access-map.ts
'use client'

import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { getUserAccess } from '@/lib/users'

type AccessMap = Record<string, string>

export function useUsersAccessMap(userIds: string[]) {
  const { data: session, status } = useSession()
  const [map, setMap] = useState<AccessMap>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const stableIds = useMemo(
    () => Array.from(new Set(userIds.filter(Boolean))),
    [userIds.join(',')]
  )

  const fetchAll = useCallback(async () => {
    if (status !== 'authenticated' || !session) return
    if (stableIds.length === 0) {
      setMap({})
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)

    try {
      const results = await Promise.allSettled(
        stableIds.map(async (id) => {
          const accessArr = await getUserAccess(id, session)
          // your API returns { obj_Access: [{ VC_UserAccess: 'Manager', ... }] }
          const label =
            accessArr?.[0]?.VC_UserAccess ??
            accessArr?.obj_Access?.[0]?.VC_UserAccess ?? // if your lib returns the raw API body
            'N/A'
          return [id, label] as const
        })
      )
      const next: AccessMap = {}
      for (const r of results) {
        if (r.status === 'fulfilled') {
          const [id, label] = r.value
          next[id] = label
        }
      }
      setMap(next)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load access levels')
    } finally {
      setLoading(false)
    }
  }, [stableIds, status, session])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return { accessMap: map, loading: loading && status !== 'authenticated', error, refetch: fetchAll }
}