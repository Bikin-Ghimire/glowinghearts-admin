// app/api/admin/refunds/route.ts
import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { getStripe } from '@/lib/stripe-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function jsonError(message: string, status = 400, rid?: string) {
  const res = NextResponse.json({ ok: false, error: message, rid }, { status })
  if (rid) res.headers.set('X-Request-Id', rid)
  return res
}

// Server-safe token getter (avoid importing hooks from /hooks/*)
async function getTokenFromSessionSafe() {
  const session = await getServerSession(authOptions)
  // Adjust to where your token actually lives on the session:
  // @ts-ignore
  return session?.accessToken || session?.token || session?.user?.token || null
}

/**
 * Looks up purchase→ { accountId, paymentIntentId, raffleGuid } from your backend.
 * If Guid_IntentId is empty but the purchaseGuid is a Checkout Session id (cs_...),
 * derives PI by retrieving the Checkout Session from Stripe (with Connect header).
 */
async function fetchPurchaseMapping(rid: string, token: string, purchaseGuid: string, stripe: import('stripe').Stripe) {
  const api = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '')
  if (!api) throw new Error('Missing NEXT_PUBLIC_API_URL')

  const url = `${api}/Purchase/${encodeURIComponent(purchaseGuid)}`
  let res: Response
  try {
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      cache: 'no-store',
    })
  } catch (e: any) {
    console.error(`[${rid}] GET ${url} network error`, e?.message || e)
    throw new Error('Backend lookup failed (network)')
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.error(`[${rid}] GET ${url} -> ${res.status}`, text)
    throw new Error(`Lookup failed: ${res.status} ${text}`)
  }

  const json = await res.json().catch(() => null)
  const obj = Array.isArray(json?.obj_Purchases) ? json.obj_Purchases[0] : null
  if (!obj) throw new Error('Purchase not found')

  const accountId = obj.VC_CharityKey as string | undefined
  let paymentIntentId = obj.Guid_IntentId as string | undefined
  const raffleGuid = obj.Guid_RaffleId as string | undefined

  if (!accountId) throw new Error('Missing VC_CharityKey (Stripe account id) on purchase')

  // Derive PI from Checkout Session if necessary
  if (!paymentIntentId && purchaseGuid.startsWith('cs_')) {
    const cs = await stripe.checkout.sessions.retrieve(
      purchaseGuid,
      { expand: ['payment_intent'] },
      { stripeAccount: accountId }
    )
    paymentIntentId =
      typeof cs.payment_intent === 'string' ? cs.payment_intent : cs.payment_intent?.id || undefined
    if (!paymentIntentId) throw new Error('Unable to derive PaymentIntent from Checkout Session')
  }
  if (!paymentIntentId) throw new Error('Missing Guid_IntentId (PaymentIntent id) on purchase')

  return { accountId, paymentIntentId, raffleGuid }
}

export async function POST(req: NextRequest) {
  const rid = Math.random().toString(36).slice(2, 8)
  console.log(`[${rid}] refunds POST hit`)

  try {
    // Init Stripe lazily
    let stripe: import('stripe').Stripe
    try {
      stripe = getStripe()
    } catch (e: any) {
      console.error(`[${rid}] Stripe init failed: ${e?.message || e}`)
      return jsonError('Server misconfig: Stripe not configured', 500, rid)
    }

    // Auth/token
    const token = await getTokenFromSessionSafe()
    if (!token) return jsonError('Unauthorized', 401, rid)

    // Body
    let body: { purchaseGuid?: string; amount?: number; note?: string }
    try {
      body = await req.json()
    } catch {
      return jsonError('Invalid JSON body', 400, rid)
    }
    const { purchaseGuid, amount, note } = body
    if (!purchaseGuid) return jsonError('purchaseGuid required', 400, rid)

    // Lookup mapping
    const { accountId, paymentIntentId, raffleGuid } = await fetchPurchaseMapping(
      rid,
      token,
      purchaseGuid,
      stripe
    )

    const amountInCents =
      typeof amount === 'number' && !Number.isNaN(amount) ? Math.round(amount * 100) : undefined

    // Create refund on the connected account
    let refund
    try {
      refund = await stripe.refunds.create(
        {
          payment_intent: paymentIntentId,
          amount: amountInCents,
          // refund_application_fee: true, // enable if needed for your fee model
          // reverse_transfer: true,       // enable if you used destination charges and need reversal
          metadata: {
            purchase_guid: purchaseGuid,
            raffle_guid: raffleGuid ?? '',
            admin_note: note ?? '',
          },
        },
        {
          stripeAccount: accountId,
          idempotencyKey: `refund_${purchaseGuid}_${amountInCents ?? 'full'}`,
        }
      )
      console.log(`[${rid}] refund created ${refund.id} on ${accountId}`)
    } catch (e: any) {
      console.error(
        `[${rid}] stripe.refunds.create failed`,
        e?.raw ? { type: e.raw.type, code: e.raw.code, message: e.raw.message } : e
      )
      return jsonError(`Stripe error: ${e?.raw?.message || e?.message || 'refund failed'}`, 502, rid)
    }

    // Webhook will update your backend
    const res = NextResponse.json({
      ok: true,
      status: 'initiated',
      refundId: refund.id,
      note: 'Stripe refund created. Backend will be updated by webhook.',
      rid,
    })
    res.headers.set('X-Request-Id', rid)
    return res
  } catch (err: any) {
    console.error(`[${rid}] [unhandled]`, err?.stack || err)
    return jsonError(err?.message || 'Refund creation failed', 500, rid)
  }
}