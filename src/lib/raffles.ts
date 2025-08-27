import { getTokenFromSession } from '@/hooks/use-session-token'

async function fetchJsonPUT(url: string, headers: Record<string, string>) {
  const res = await fetch(url, { method: 'PUT', headers, body: JSON.stringify({}) })
  const raw = await res.text().catch(() => '')
  let json: any = null
  try { json = raw ? JSON.parse(raw) : null } catch { /* keep json = null */ }

  if (!res.ok) {
    console.warn('[raffles] PUT failed', { url, status: res.status, raw })
  } else {
    // Helpful trace to confirm payload shape
    console.debug('[raffles] PUT ok', { url, status: res.status, keys: json ? Object.keys(json) : [] })
  }
  return { ok: res.ok, status: res.status, json }
}

export async function fetchRaffleDetail(session: any, Guid_RaffleId: string) {
  const token = await getTokenFromSession(session)
  if (!token) throw new Error('Unable to retrieve session token')

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }

  const [
    raffleRes,
    bannerRes,
    prizesRes,
    buyInsRes,
    purchasesRes,
    logsRes,
    ticketLogsRes,
    prizeLogsRes,
    buyInLogsRes,
    refundRes,
  ] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/Raffle/${Guid_RaffleId}`, { headers }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/Banner/${Guid_RaffleId}/50`, { headers }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/Prize/List/${Guid_RaffleId}`, { headers }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/BuyIn/List/${Guid_RaffleId}`, { headers }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/Report/Tickets/${Guid_RaffleId}`, { method: 'PUT', headers, body: JSON.stringify({}) }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/Report/Except_Raffle/${Guid_RaffleId}`, { method: 'PUT', headers, body: JSON.stringify({}) }),
    fetchJsonPUT(`${process.env.NEXT_PUBLIC_API_URL}/Report/Except_Tickets/${Guid_RaffleId}`, headers),
    fetchJsonPUT(`${process.env.NEXT_PUBLIC_API_URL}/Report/Except_Prizes/${Guid_RaffleId}`, headers),
    fetchJsonPUT(`${process.env.NEXT_PUBLIC_API_URL}/Report/Except_BuyIns/${Guid_RaffleId}`, headers),
    fetchJsonPUT(`${process.env.NEXT_PUBLIC_API_URL}/Report/Refunds/${Guid_RaffleId}`, headers),
  ])

  const [
    raffleData,
    bannerData,
    prizesData,
    buyInsData,
    purchasesData,
    logsData,
    ticketLogs,
    prizeLogs,
    buyInLogs,
    refunds,
  ] = await Promise.all([
    raffleRes.json(),
    bannerRes.ok ? bannerRes.json() : null,
    prizesRes.ok ? prizesRes.json() : [],
    buyInsRes.ok ? buyInsRes.json() : [],
    purchasesRes.ok ? purchasesRes.json() : [],
    logsRes.ok ? logsRes.json() : [],
    Promise.resolve(ticketLogsRes as any),
    Promise.resolve(prizeLogsRes as any),
    Promise.resolve(buyInLogsRes as any),
    Promise.resolve(refundRes as any),
  ])

  // Extract arrays (log and warn if missing/malformed)
  const extractUpdates = (label: string, payload: any) => {
    const list = Array.isArray(payload?.json?.obj_UpdatesList) ? payload.json.obj_UpdatesList : []
    if (!Array.isArray(list)) {
      console.warn(`[raffles] ${label} missing obj_UpdatesList`, { status: payload?.status, keys: payload?.json ? Object.keys(payload.json) : null, sample: payload?.json })
    } else {
      console.debug(`[raffles] ${label} count`, list.length)
    }
    return list
  }

  const extractRefunds = (payload: any) => {
  const list = Array.isArray(payload?.json?.obj_Refunds) ? payload.json.obj_Refunds : []
  if (!Array.isArray(list)) {
    console.warn('[raffles] refunds missing obj_Refunds', {
      status: payload?.status,
      keys: payload?.json ? Object.keys(payload.json) : null,
      sample: payload?.json,
    })
  } else {
    console.debug('[raffles] refunds count', list.length)
  }
  return list
}

  return {
    raffle: Array.isArray(raffleData?.obj_Raffles) ? raffleData.obj_Raffles[0] : null,
    bannerUrl: Array.isArray(bannerData?.obj_Banner) ? (bannerData.obj_Banner[0]?.VC_BannerLocation ?? null) : null,
    prizes: Array.isArray(prizesData?.obj_Prizes) ? prizesData.obj_Prizes : [],
    buyIns: Array.isArray(buyInsData?.obj_BuyIns) ? buyInsData.obj_BuyIns : [],
    purchases: Array.isArray(purchasesData?.obj_TicketList) ? purchasesData.obj_TicketList : [],
    logs: Array.isArray(logsData?.obj_UpdatesList) ? logsData.obj_UpdatesList : [],

    // NEW
    ticketLogs: extractUpdates('ticketLogs', ticketLogs),
    prizeLogs:  extractUpdates('prizeLogs',  prizeLogs),
    buyInLogs:  extractUpdates('buyInLogs',  buyInLogs),
    refunds: extractRefunds(refunds),
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
  if (!token) {
    console.error('Unable to retrieve session token')
    alert('Unable to retrieve session token.')
    return
  }
  try {
    await apiFn(id, token)
  } catch (err) {
    console.error('Failed to update raffle status:', err)
    alert('Failed to update raffle on server.')
    return
  }

  updateFn((prev: any) => {
    if (Array.isArray(prev)) {
      return prev.map((c) => (c.Guid_RaffleId === id ? { ...c, Int_DrawStatus: newStatus } : c))
    } else if (prev?.Guid_RaffleId === id) {
      return { ...prev, Int_DrawStatus: newStatus }
    }
    return prev
  })
}

export async function activateRaffle(id: string, token: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Raffle/Activate/${id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Activate failed: ${res.status} - ${await res.text()}`)
  return res.json()
}

export async function deactivateRaffle(id: string, token: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Raffle/DeActivate/${id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Deactivate failed: ${res.status} - ${await res.text()}`)
  return res.json()
}