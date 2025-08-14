'use client'

import { useSession, signIn } from 'next-auth/react'
import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { getTokenFromSession } from './use-session-token'

type UpdatePasswordInput = {
  currentPassword: string
  newPassword: string
}

export function useUpdatePassword() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function updatePassword({ currentPassword, newPassword }: UpdatePasswordInput) {
    if (!session?.user?.id || !session.user.email) {
      toast.error('Not authenticated')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const token = await getTokenFromSession(session)
      if (!token) throw new Error('Not authenticated')

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/user/pwd/${encodeURIComponent(session.user.id)}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            VC_PwdOld: currentPassword,
            VC_PwdNew: newPassword,
          }),
        }
      )

      const data = await res.json().catch(() => null)
      if (!res.ok) {
        const msg =
          (data && (data.error || data.message)) ||
          (res.status === 401 ? 'Incorrect current password' : 'Failed to update password')
        throw new Error(msg)
      }

      // Re-login with the new password so future Bearers use it
      await signIn('credentials', {
        redirect: false,
        email: session.user.email,
        password: newPassword,
      })

      toast.success('Password updated')
      return true
    } catch (e: any) {
      const msg = e?.message || 'Failed to update password'
      setError(msg)
      toast.error(msg)
      return false
    } finally {
      setLoading(false)
    }
  }

  return { updatePassword, loading, error }
}