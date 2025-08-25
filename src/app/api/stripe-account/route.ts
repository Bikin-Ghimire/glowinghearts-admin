// app/api/stripe/status/route.ts
import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function jsonError(message: string, status = 400, rid?: string) {
  const res = NextResponse.json({ ok: false, error: message, rid }, { status })
  if (rid) res.headers.set('X-Request-Id', rid)
  return res
}

export async function POST(req: NextRequest) {
  const rid = Math.random().toString(36).slice(2, 8)
  console.log(`[${rid}] stripe/status POST hit`)

  try {
    let stripe
    try {
      stripe = getStripe()
    } catch (e: any) {
      console.error(`[${rid}] Stripe init failed: ${e?.message || e}`)
      return jsonError('Server misconfig: Stripe not configured', 500, rid)
    }

    let body: { accountId?: string }
    try {
      body = await req.json()
    } catch {
      return jsonError('Invalid JSON body', 400, rid)
    }

    const accountId = body.accountId?.trim()
    if (!accountId) return jsonError('Missing "accountId"', 400, rid)

    const account = await stripe.accounts.retrieve(accountId, { expand: ['capabilities'] })

    const res = NextResponse.json({
      ok: true,
      rid,
      accountId,
      charges_enabled: account.charges_enabled,
      details_submitted: account.details_submitted,
      payouts_enabled: account.payouts_enabled,
      capabilities: {
        card_payments: account.capabilities?.card_payments,
        transfers: account.capabilities?.transfers,
      },
    })
    res.headers.set('X-Request-Id', rid)
    return res
  } catch (error: any) {
    console.error(`[${rid}] status error`, error?.raw?.message || error?.message || error)
    return jsonError(`Stripe error: ${error?.raw?.message || error?.message || 'unknown'}`, 500, rid)
  }
}