'use client'

import { getUserAccess, getUserById } from '@/lib/users'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useState } from 'react'

export function useUserProfile() {
  const { data: session, status } = useSession()
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUserProfile = useCallback(async (userId: string, sess: typeof session) => {
    try {
      setLoading(true)
      const user = await getUserById(userId, sess!)
      setUserProfile(user)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, []) // no deps

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      fetchUserProfile(session.user.id, session)
    }
  }, [status, session, fetchUserProfile])

  return { userProfile, loading: loading && status !== 'authenticated', error, refetchUserProfile: fetchUserProfile }
}

export function useUserAccess() {
  const { data: session, status } = useSession()
  const [access, setAccess] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUserAccess = useCallback(async (userId: string, sess: typeof session) => {
    try {
      setLoading(true)
      const userAccess = await getUserAccess(userId, sess!)
      setAccess(userAccess)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load access')
    } finally {
      setLoading(false)
    }
  }, []) // no deps

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      fetchUserAccess(session.user.id, session)
    }
  }, [status, session, fetchUserAccess])

  return { access, loading: loading && status !== 'authenticated', error, refetchUserAccess: fetchUserAccess }
}
