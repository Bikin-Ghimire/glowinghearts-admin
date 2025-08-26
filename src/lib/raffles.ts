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
    ticketLogsRes, // NEW
    prizeLogsRes,  // NEW
    buyInLogsRes,  // NEW
  ] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/Raffle/${Guid_RaffleId}`, { headers }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/Banner/${Guid_RaffleId}/50`, { headers }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/Prizes/${Guid_RaffleId}`, { headers }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/BuyIns/${Guid_RaffleId}`, { headers }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/Report/Tickets/${Guid_RaffleId}`, { method: 'PUT', headers, body: JSON.stringify({}) }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/Report/Except_Raffle/${Guid_RaffleId}`, { method: 'PUT', headers, body: JSON.stringify({}) }),

    // Use robust PUT reader for the three new logs
    fetchJsonPUT(`${process.env.NEXT_PUBLIC_API_URL}/Report/Except_Tickets/${Guid_RaffleId}`, headers),
    fetchJsonPUT(`${process.env.NEXT_PUBLIC_API_URL}/Report/Except_Prizes/${Guid_RaffleId}`, headers),
    fetchJsonPUT(`${process.env.NEXT_PUBLIC_API_URL}/Report/Except_BuyIns/${Guid_RaffleId}`, headers),
  ])

  const [
    raffleData,
    bannerData,
    prizesData,
    buyInsData,
    purchasesData,
    logsData,
    ticketLogs, // { ok, status, json }
    prizeLogs,  // { ok, status, json }
    buyInLogs,  // { ok, status, json }
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
  }
}