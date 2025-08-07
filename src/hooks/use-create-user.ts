// hooks/use-create-user.ts
'use client'

import { useSession } from 'next-auth/react'
import { useState } from 'react'
import { getTokenFromSession } from './use-session-token'

export function useCreateUser() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function createUser({
    VC_FirstName,
    VC_LastName,
    VC_Email,
    VC_Pwd,
  }: {
    VC_FirstName: string
    VC_LastName: string
    VC_Email: string
    VC_Pwd: string
  }) {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const token = await getTokenFromSession(session)
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ VC_FirstName, VC_LastName, VC_Email, VC_Pwd }),
      })

      if (!res.ok) throw new Error('Failed to create user')
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return { createUser, loading, error, success }
}