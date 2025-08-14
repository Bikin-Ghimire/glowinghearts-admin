'use client'

import { useSession } from 'next-auth/react'
import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { getTokenFromSession } from './use-session-token'

type CreateUserInput = {
  VC_FirstName: string
  VC_LastName: string
  VC_Email: string
}

export function useCreateUser() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function createUser(input: CreateUserInput) {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const token = await getTokenFromSession(session)
      if (!token) throw new Error('Not authenticated')

      const res = await fetch('/api/users/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(input),
      })

      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error((data && (data.error || data.message)) || `Failed (${res.status})`)
      }

      if (data?.emailSent === false) {
        toast('User created, but the email failed to send.', { icon: '📧' })
      } else {
        toast.success('User created and email sent.')
      }

      if (data?.accessAssigned === false) {
        toast('User created, but default access was not set.', { icon: '⚠️' })
      }

      setSuccess(true)
      return true
    } catch (err: any) {
      const msg = err?.message || 'Something went wrong'
      toast.error(msg)
      setError(msg)
      return false
    } finally {
      setLoading(false)
    }
  }

  return { createUser, loading, error, success }
}