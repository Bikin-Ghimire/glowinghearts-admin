import { getTokenFromSession } from '@/hooks/use-session-token'

export async function fetchRaffleDetail(session: any, Guid_RaffleId: string) {
  const token = await getTokenFromSession(session)
  if (!token) throw new Error('Unable to retrieve session token')

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }

  const [raffleRes, bannerRes, prizesRes, buyInsRes, purchasesRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/Raffle/${Guid_RaffleId}`, { headers }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/Banner/${Guid_RaffleId}/50`, { headers }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/Prizes/${Guid_RaffleId}`, { headers }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/BuyIns/${Guid_RaffleId}`, { headers }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/Report/Tickets/${Guid_RaffleId}`, { headers }),
  ])

  const [raffleData, bannerData, prizesData, buyInsData, purchasesData] = await Promise.all([
    raffleRes.json(),
    bannerRes.ok ? bannerRes.json() : null,
    prizesRes.ok ? prizesRes.json() : [],
    buyInsRes.ok ? buyInsRes.json() : [],
    purchasesRes.ok ? purchasesRes.json() : [],
  ])

  return {
    raffle: Array.isArray(raffleData?.obj_Raffles) ? raffleData.obj_Raffles[0] : null,
    bannerUrl: Array.isArray(bannerData?.obj_Banner) ? bannerData.obj_Banner[0]?.VC_BannerLocation ?? null : null,
    prizes: Array.isArray(prizesData?.obj_Prizes) ? prizesData.obj_Prizes : [],
    buyIns: Array.isArray(buyInsData?.obj_BuyIns) ? buyInsData.obj_BuyIns : [],
    purchases: Array.isArray(purchasesData?.obj_TicketList) ? purchasesData.obj_TicketList : [],
  }
}

export async function updateRaffleStatus({
  session,
  id,
  newStatus,
  updateFn,
  apiFn,
}: {
  session: any
  id: string
  newStatus: number
  updateFn: (updater: any) => void
  apiFn: (id: string, token: string) => Promise<any>
}) {
  const token = await getTokenFromSession(session)
  try {
    const res = await apiFn(id, token)
    console.log('Backend response:', res)
  } catch (err) {
    console.error('Failed to update raffle status:', err)
    alert('Failed to update raffle on server.')
    return
  }

  updateFn((prev: any) => {
    if (Array.isArray(prev)) {
      return prev.map((c) =>
        c.Guid_RaffleId === id ? { ...c, Int_DrawStatus: newStatus } : c
      )
    } else if (prev?.Guid_RaffleId === id) {
      return { ...prev, Int_DrawStatus: newStatus }
    }
    return prev
  })
}

export async function activateRaffle(id: string, token: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Raffle/Activate/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Activate failed: ${res.status} - ${errText}`)
  }

  return res.json()
}