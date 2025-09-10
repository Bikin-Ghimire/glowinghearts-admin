// lib/tickets.ts
import { getTokenFromSession } from '@/hooks/use-session-token'

export type TicketRecord = {
  Guid_TicketId: string
  Guid_PurchaseId: string
  Guid_BuyIn: string
  Int_Package: number
  Int_VoidFlag: number
  JSON_Notes?: string | null
  VC_PlayerEmail: string
  VC_PlayerFullName: string
  VC_PlayerAddr1: string
  VC_PlayerAddr2?: string
  VC_PlayerCity: string
  VC_PlayerProvince: string
  VC_PlayerPostalCode: string
  VC_PlayerPhone?: string
  Dt_Purchased: string
  Dt_CreateUpdate: string
  Guid_AdminId?: string | null
}

export async function getTicketById(
  session: any,
  raffleId: string,
  ticketId: string
): Promise<TicketRecord> {
  const token = await getTokenFromSession(session)
  if (!token) throw new Error('Unable to retrieve session token')

  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '')
  if (!base) throw new Error('Missing NEXT_PUBLIC_API_URL')

  const res = await fetch(`${base}/Ticket/${encodeURIComponent(raffleId)}/${encodeURIComponent(ticketId)}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    cache: 'no-store',
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${res.status} - ${text || 'Ticket fetch failed'}`)

  let json: any
  try { json = text ? JSON.parse(text) : {} } catch { throw new Error('Malformed ticket response') }

  if (typeof json?.err_Code !== 'number' || json.err_Code !== 0) {
    throw new Error(json?.message || 'Ticket API err_Code non-zero')
  }
  const obj = Array.isArray(json?.obj_Tickets) ? json.obj_Tickets[0] : null
  if (!obj) throw new Error('Ticket not found')
  return obj as TicketRecord
}