'use client'

import { CharityDetails } from '@/components/charity/charity-details'
import { CharityOverview } from '@/components/charity/charity-overview'
import { CharityRaffleList } from '@/components/charity/charity-raffle-list'
import { useCharityDetailActions } from '@/hooks/use-charity-detail-actions'
import { useCharityDetails } from '@/hooks/use-charity-details'
import { useSession } from 'next-auth/react'

type Params = { params: { Guid_CharityId: string } }

export default function CharityPage({ params: { Guid_CharityId } }: Params) {
  const { data: session } = useSession()
  const { charity, bannerUrl, raffles, loading, error, refetchCharity } = useCharityDetails(Guid_CharityId)
  const { handleActivate, handleDeactivate } = useCharityDetailActions(session, refetchCharity)

  if (loading) return <p>Loading...</p>
  if (error) return <p className="text-red-600">Error: {error}</p>
  if (!charity) return <p>Charity not found.</p>

  return (
    <>
      <CharityOverview
        charity={charity}
        bannerUrl={bannerUrl}
        handleActivate={handleActivate}
        handleDeactivate={handleDeactivate}
      />
      <CharityDetails charity={charity} />
      <CharityRaffleList charity={charity} raffles={raffles} />
    </>
  )
}
