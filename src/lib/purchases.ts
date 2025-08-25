// lib/purchases.ts
import { getTokenFromSession } from '@/hooks/use-session-token'

export type PackageItem = {
  Int_Package: number
  VC_Description: string
  Int_NumbTicket: number
  Dec_Price: number
  obj_Tickets: string[]
  Guid_BuyIn?: string
}

export type GetPurchasePayload = {
  Guid_RaffleId: string
  VC_CharityKey: string
  Guid_IntentId: string
  Guid_PurchaseId: string
  VC_PlayerEmail: string
  VC_PlayerFullName: string
  VC_PlayerAddr1?: string
  VC_PlayerAddr2?: string
  VC_PlayerCity?: string
  VC_PlayerProvince?: string
  VC_PlayerPostalCode?: string
  VC_PlayerPhone?: string
  Dt_Purchased: string
  Int_TotalTickets: number
  Dec_TotalPrice: number
  Int_AgeVerified?: number
  Int_TC_Confirmed?: number
  VC_PurchaseIP?: string
  VC_GeoLocation?: string
  obj_Packages: PackageItem[]
}

export async function getPurchaseById(session: any, purchaseId: string): Promise<GetPurchasePayload> {
  const token = await getTokenFromSession(session)
  if (!token) throw new Error('Unable to retrieve session token')

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Purchase/${encodeURIComponent(purchaseId)}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`${res.status} - ${await res.text()}`)
  const json = await res.json()
  const obj = Array.isArray(json?.obj_Purchases) ? json.obj_Purchases[0] : null
  if (!obj) throw new Error('Purchase not found')
  return obj as GetPurchasePayload
}

export async function refundPurchase(session: any, raffleId: string, purchaseId: string, payload: {
  Guid_RefundId: string // from GetPurchase.Guid_IntentId
  Dec_Refund: number
  VC_Note?: string
  Dt_Credit?: string // "YYYY-MM-DD HH:mm:ss", optional (defaults now)
}) {
  const token = await getTokenFromSession(session)
  if (!token) throw new Error('Unable to retrieve session token')

  const Dt_Credit =
    payload.Dt_Credit ?? new Date().toISOString().slice(0, 19).replace('T', ' ')

  const body = {
    Guid_RaffleId: raffleId,
    Guid_RefundId: payload.Guid_RefundId,
    Dec_Refund: Number(payload.Dec_Refund),
    Dt_Credit,
    VC_Note: payload.VC_Note || 'Admin-initiated refund',
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Refund/${encodeURIComponent(purchaseId)}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Refund failed: ${res.status} - ${await res.text()}`)
  return res.json()
}