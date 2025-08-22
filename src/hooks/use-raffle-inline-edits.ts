// app/hooks/use-raffle-inline-edits.ts
'use client'

import { useSession } from 'next-auth/react'
import { getTokenFromSession } from './use-session-token'

type RaffleCorePayload = {
  VC_LicenseNumb: string
  VC_RaffleName: string
  VC_RaffleLocation: string
  Dt_SaleOpen: string // "YYYY-MM-DD HH:mm:ss"
  Dt_SaleClose: string
  Int_TimeFrame: number
  Int_UnClaimedTimeOut: number
}

type PrizePayload = {
  Int_Place: number
  Int_Prize_Type: number
  Int_AutomatedDraw: number
  VC_Description: string
  Int_PrizeValuePercent: number
  Dec_Value: number
  Dt_Draw: string // "YYYY-MM-DD HH:mm:ss"
}

type BuyInPayload = {
  Int_NumbTicket: number
  Dec_Price: number
  VC_Description: string
}

export function useRaffleInlineEdits() {
  const { data: session } = useSession()

  async function authedFetch(input: string, init: RequestInit = {}) {
    const token = await getTokenFromSession(session)
    if (!token) throw new Error('Not authenticated')
    const headers = new Headers(init.headers || {})
    if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`)
    if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
    return fetch(input, { ...init, headers })
  }

  // 1) Core raffle
  async function updateRaffleCore(raffleId: string, payload: RaffleCorePayload) {
    const res = await authedFetch(`${process.env.NEXT_PUBLIC_API_URL}/Raffle/${raffleId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }

  // 2) Details
  async function updateDetails(raffleId: string, html: string) {
    const res = await authedFetch(`${process.env.NEXT_PUBLIC_API_URL}/Raffle/Details/${raffleId}`, {
      method: 'PUT',
      body: JSON.stringify({ Txt_GameDetails: html }),
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }

  // 3) Rules
  async function updateRules(raffleId: string, htmlOrText: string) {
    const res = await authedFetch(`${process.env.NEXT_PUBLIC_API_URL}/Raffle/Rules/${raffleId}`, {
      method: 'PUT',
      body: JSON.stringify({ Txt_GameRules: htmlOrText }),
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }

  // 4) Prize
  async function updatePrize(prizeId: string, payload: PrizePayload) {
    const res = await authedFetch(`${process.env.NEXT_PUBLIC_API_URL}/Prize/${prizeId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }

  // 5) Buy-In
  async function updateBuyIn(buyInId: string, payload: BuyInPayload) {
    const res = await authedFetch(`${process.env.NEXT_PUBLIC_API_URL}/BuyIn/${buyInId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }

  // 6) Banner
  async function updateBanner(raffleId: string, url: string) {
    const res = await authedFetch(`${process.env.NEXT_PUBLIC_API_URL}/Banner/`, {
      method: 'POST',
      body: JSON.stringify({
        Guid_Id: raffleId,
        Int_BannerType: 50,
        VC_BannerLocation: url,
      }),
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }

  // 7) Delete Prize
  async function deletePrize(prizeId: string) {
    const res = await authedFetch(`${process.env.NEXT_PUBLIC_API_URL}/Prize/${prizeId}`, {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }

  // 8) Delete Buy-In (Bundle)
  async function deleteBuyIn(buyInId: string) {
    const res = await authedFetch(`${process.env.NEXT_PUBLIC_API_URL}/BuyIn/${buyInId}`, {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }

  return {
    updateRaffleCore,
    updateDetails,
    updateRules,
    updatePrize,
    updateBuyIn,
    updateBanner,
    deletePrize,
    deleteBuyIn,
  }
}
