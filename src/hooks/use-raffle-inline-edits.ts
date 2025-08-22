// app/hooks/use-raffle-inline-edits.ts
'use client'

import { useSession } from 'next-auth/react'
import { getTokenFromSession } from './use-session-token'
import {
  PRIZE_TYPES,
  type PrizePayload as PrizePayloadRules,
  type RaffleCore as RaffleCoreRules,
  type Prize as PrizeRulesType,
  canDeletePrize,
  normalizeAndValidatePrizeUpdate,
} from '@/lib/prize-rules'

type RaffleCorePayload = {
  VC_LicenseNumb: string
  VC_RaffleName: string
  VC_RaffleLocation: string
  Dt_SaleOpen: string
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
  Dt_Draw: string
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

  // ---------------------------
  // Core, details, rules, buy-ins… (unchanged)
  // ---------------------------

  async function updateRaffleCore(raffleId: string, payload: RaffleCorePayload) {
    const res = await authedFetch(`${process.env.NEXT_PUBLIC_API_URL}/Raffle/${raffleId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }

  async function updateDetails(raffleId: string, html: string) {
    const res = await authedFetch(`${process.env.NEXT_PUBLIC_API_URL}/Raffle/Details/${raffleId}`, {
      method: 'PUT',
      body: JSON.stringify({ Txt_GameDetails: html }),
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }

  async function updateRules(raffleId: string, htmlOrText: string) {
    const res = await authedFetch(`${process.env.NEXT_PUBLIC_API_URL}/Raffle/Rules/${raffleId}`, {
      method: 'PUT',
      body: JSON.stringify({ Txt_GameRules: htmlOrText }),
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }

  async function updateBuyIn(buyInId: string, payload: BuyInPayload) {
    const res = await authedFetch(`${process.env.NEXT_PUBLIC_API_URL}/BuyIn/${buyInId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }

  async function deleteBuyIn(buyInId: string) {
    const res = await authedFetch(`${process.env.NEXT_PUBLIC_API_URL}/BuyIn/${buyInId}`, {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }

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

  // ---------------------------
  // Prize: SAFE EDIT & DELETE
  // ---------------------------

  /**
   * Safe wrapper that enforces all prize rules before PUT.
   * @param prizeId target prize id
   * @param payload proposed changes (may include user-edited fields)
   * @param ctx includes raffle core & full prize list (from useRaffleDetails)
   */
  async function updatePrizeSafe(
    prizeId: string,
    payload: PrizePayload,
    ctx: { raffle: RaffleCoreRules; prizes: PrizeRulesType[] }
  ) {
    // Validate + normalize (auto-fill hidden fields)
    const result = normalizeAndValidatePrizeUpdate(
      payload as PrizePayloadRules,
      ctx.raffle,
      ctx.prizes as PrizeRulesType[],
      prizeId
    )
    if (!result.ok) {
      throw new Error(result.errors.join('\n'))
    }

    const res = await authedFetch(`${process.env.NEXT_PUBLIC_API_URL}/Prize/${prizeId}`, {
      method: 'PUT',
      body: JSON.stringify(result.normalized),
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }

  /**
   * Safe delete: blocks deleting Place 1.
   */
  async function deletePrizeSafe(
    prizeId: string,
    ctx: { prizes: PrizeRulesType[] }
  ) {
    const prize = ctx.prizes.find(p => p.Guid_PrizeId === prizeId)
    if (!prize) throw new Error('Prize not found.')

    if (!canDeletePrize(prize)) {
      throw new Error('You cannot delete the main prize (Place 1).')
    }

    const res = await authedFetch(`${process.env.NEXT_PUBLIC_API_URL}/Prize/${prizeId}`, {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }

  // Backward compatibility (if you still call the raw versions anywhere)
  async function updatePrize(prizeId: string, payload: PrizePayload) {
    // If called directly, this will NOT enforce rules.
    // Prefer updatePrizeSafe with context to enforce rules.
    const res = await authedFetch(`${process.env.NEXT_PUBLIC_API_URL}/Prize/${prizeId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }

  async function deletePrize(prizeId: string) {
    // If called directly, this will NOT enforce rules.
    // Prefer deletePrizeSafe with context to enforce rules.
    const res = await authedFetch(`${process.env.NEXT_PUBLIC_API_URL}/Prize/${prizeId}`, {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }

  return {
    updateRaffleCore,
    updateDetails,
    updateRules,
    updatePrize,          // legacy
    updatePrizeSafe,      // ✅ use this
    updateBuyIn,
    deleteBuyIn,
    updateBanner,
    deletePrize,          // legacy
    deletePrizeSafe,      // ✅ use this
  }
}