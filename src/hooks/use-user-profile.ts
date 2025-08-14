'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { getUserById, getUserAccess } from '@/lib/users'

export function useUserProfile() {
  const { data: session, status } = useSession()
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUserProfile = useCallback(async () => {
    if (status !== 'authenticated' || !session?.user?.id) return
    try {
      setLoading(true)
      const user = await getUserById(session.user.id, session) // <-- pass session (not token)
      setUserProfile(user)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [status, session?.user?.id]) // keep deps small to avoid re-fetch loops

  useEffect(() => {
    fetchUserProfile()
  }, [fetchUserProfile])

  return { userProfile, loading: loading && status !== 'authenticated', error, refetchUserProfile: fetchUserProfile }
}

export function useUserAccess() {
  const { data: session, status } = useSession()
  const [access, setAccess] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUserAccess = useCallback(async () => {
    if (status !== 'authenticated' || !session?.user?.id) return
    try {
      setLoading(true)
      const userAccess = await getUserAccess(session.user.id, session) // <-- pass session
      setAccess(userAccess)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load access')
    } finally {
      setLoading(false)
    }
  }, [status, session?.user?.id])

  useEffect(() => {
    fetchUserAccess()
  }, [fetchUserAccess])

  return { access, loading: loading && status !== 'authenticated', error, refetchUserAccess: fetchUserAccess }
}