'use client'

import { getCharities } from '@/lib/charities'
import { Charity } from '@/types/charity'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useState } from 'react'
import CharityListView from './charity-list-view'

export default function CharityList() {
  const { data: session } = useSession()
  const [charities, setCharities] = useState<Charity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetchCharities = useCallback(() => {
    if (!session) return
    setLoading(true)
    getCharities(session)
      .then(setCharities)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [session])

  useEffect(() => {
    refetchCharities()
  }, [refetchCharities])

  if (loading) return <p>Loading...</p>
  if (error) return <p className="text-red-600">Error: {error}</p>

  return <CharityListView charities={charities} refetchCharities={refetchCharities} session={session} />
}
