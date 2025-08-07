// hooks/useRaffleDetails.ts
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useState } from 'react'
import { fetchRaffleDetail } from '@/lib/raffles'

export function useRaffleDetails(Guid_RaffleId: string) {
  const { data: session } = useSession()
  const [raffle, setRaffle] = useState<any>(null)
  const [bannerUrl, setBannerUrl] = useState<string | null>(null)
  const [prizes, setPrizes] = useState<any[]>([])
  const [buyIns, setBuyIns] = useState<any[]>([])
  const [purchases, setPurchases] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDetails = useCallback(async () => {
    if (!session) return

    try {
      const data = await fetchRaffleDetail(session, Guid_RaffleId)

      console.log('Logs received from API:', data.logs)

      setRaffle(data.raffle)
      setBannerUrl(data.bannerUrl)
      setPrizes(data.prizes)
      setBuyIns(data.buyIns)
      setPurchases(data.purchases)
      setLogs(data.logs)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [Guid_RaffleId, session])

  useEffect(() => {
    loadDetails()
  }, [loadDetails])

  return {
    raffle,
    setRaffle,
    bannerUrl,
    prizes,
    buyIns,
    purchases,
    logs,
    loading,
    error,
  }
}