'use client'

import { useSession } from 'next-auth/react'
import { useRaffleDetails } from '@/hooks/use-raffle-details'
import { useRaffleDetailActions } from '@/hooks/use-raffle-detail-actions'
import { RaffleHeader } from '@/components/raffle/single-raffle/raffle-header'
import { RaffleStats } from '@/components/raffle/single-raffle/raffle-stats'
import { RaffleTabs } from '@/components/raffle/single-raffle/raffle-tabs'

type Params = { params: { Guid_RaffleId: string } }

export default function RafflePage({ params: { Guid_RaffleId } }: Params) {
  const { data: session } = useSession()
  const {
    raffle,
    setRaffle,
    bannerUrl,
    prizes,
    buyIns,
    purchases,
    loading,
    error,
  } = useRaffleDetails(Guid_RaffleId)

  const { handleActivate, handleDeactivate } = useRaffleDetailActions(session, setRaffle)

  if (loading) return <p>Loading...</p>
  if (error) return <p className="text-red-600">Error: {error}</p>
  if (!raffle) return <p className="text-red-600">Raffle not found.</p>

  return (
    <>
      <RaffleHeader
        raffle={raffle}
        bannerUrl={bannerUrl}
        onActivate={() => handleActivate(raffle.Guid_RaffleId)}
        onDeactivate={() => handleDeactivate(raffle.Guid_RaffleId)}
      />
      <RaffleStats raffle={raffle} />
      <RaffleTabs raffle={raffle} purchases={purchases} prizes={prizes} buyIns={buyIns} />
    </>
  )
}