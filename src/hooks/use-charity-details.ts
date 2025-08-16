// hooks/useCharityDetails.ts
import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { getTokenFromSession } from './use-session-token'
import { getCharityById, getCharityRaffles } from '@/lib/charities'

export function useCharityDetails(Guid_CharityId: string) {
  const { data: session } = useSession()
  const [charity, setCharity] = useState<any>(null)
  const [bannerUrl, setBannerUrl] = useState<string | null>(null)
  const [raffles, setRaffles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!session?.user?.email || !session?.user?.password) return

    try {
      setLoading(true)
      const token = await getTokenFromSession(session)
      if (!token) {
        setError('Unable to get auth token')
        return
      }

      const charity = await getCharityById(Guid_CharityId, token)
      setCharity(charity)

      const raffleList = await getCharityRaffles(Guid_CharityId, token)
      setRaffles(raffleList)

      // Optional: banner fetch
      const bannerRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Banner/${Guid_CharityId}/1`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (bannerRes.ok) {
        const bannerData = await bannerRes.json()
        const location = Array.isArray(bannerData?.obj_Banner)
          ? bannerData.obj_Banner[0]?.VC_BannerLocation
          : null
        setBannerUrl(location || null)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [Guid_CharityId, session])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    charity,
    bannerUrl,
    raffles,
    loading,
    error,
    refetchCharity: fetchData, // ← expose for re-use
  }
}