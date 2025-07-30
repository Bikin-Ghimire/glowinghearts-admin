'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { getUsers } from '@/lib/users'
import { User } from '@/types/user'
import UserListView from './user-list-view'

export default function UserList() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session) return
    getUsers(session)
      .then(setUsers)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [session])

  if (loading) return <p>Loading...</p>
  if (error) return <p className="text-red-600">Error: {error}</p>

  return (
    <UserListView
      users={users}
      setUsers={setUsers}
      session={session}
    />
  )
}