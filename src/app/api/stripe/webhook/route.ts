// app/api/stripe/webhook/route.ts
import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

// --- Simple in-memory de-dupe cache (per server instance) ---
type CacheEntry = { ts: number }
const REFUND_TTL_MS = 2 * 60 * 1000 // 2 minutes window
const g = globalThis as any
if (!g.__refundSeen) g.__refundSeen = new Map<string, CacheEntry>()
const refundSeen: Map<string, CacheEntry> = g.__refundSeen
function recentlyProcessed(key: string) {
  const now = Date.now()
  const entry = refundSeen.get(key)
  if (entry && now - entry.ts < REFUND_TTL_MS) return true
  // purge old occasionally
  if (refundSeen.size > 1000) {
    for (const [k, v] of Array.from(refundSeen.entries())) if (now - v.ts >= REFUND_TTL_MS) refundSeen.delete(k)
  }
  return false
}
function markProcessed(key: string) {
  refundSeen.set(key, { ts: Date.now() })
}

function formatAsSqlDatetimeFromUnixSeconds(unixSecs: number): string {
  const d = new Date(unixSecs * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
}

function isRefundEvent(e: Stripe.Event): e is Stripe.Event & { data: { object: Stripe.Refund } } {
  return e.type.startsWith('refund.') && (e.data?.object as any)?.object === 'refund'
}
function isChargeEvent(e: Stripe.Event): e is Stripe.Event & { data: { object: Stripe.Charge } } {
  return e.type.startsWith('charge.') && (e.data?.object as any)?.object === 'charge'
}

// Mint backend JWT via your app
async function getBackendJWTFromApp(): Promise<string> {
  const VC_Email = process.env.BACKEND_SVC_EMAIL
  const VC_Pwd = process.env.BACKEND_SVC_PWD
  if (!VC_Email || !VC_Pwd) throw new Error('Missing BACKEND_SVC_EMAIL / BACKEND_SVC_PWD')
  const base =
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  const res = await fetch(`${base.replace(/\/$/, '')}/api/create-jwt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ VC_Email, VC_Pwd }),
    cache: 'no-store',
  })
  const text = await res.text().catch(() => '')
  if (!res.ok) throw new Error(`create-jwt failed: ${res.status} ${text}`)
  let token = ''
  try {
    const j = JSON.parse(text)
    token = j?.token || j?.jwt || j?.accessToken || ''
  } catch { token = text }
  if (!token) throw new Error('create-jwt: no token in response')
  return token
}

// Normalize any of refund.* or charge.* to Stripe.Refund
async function extractRefundFromEvent(
  e: Stripe.Event,
  stripe: Stripe
): Promise<{ refund: Stripe.Refund; accountId?: string }> {
  const accountId = (e as any).account as string | undefined

  if (isRefundEvent(e)) return { refund: e.data.object, accountId }

  if (isChargeEvent(e)) {
    let charge = e.data.object
    if (!charge.refunds || !Array.isArray(charge.refunds.data) || charge.refunds.data.length === 0) {
      const hydrated = await stripe.charges.retrieve(
        charge.id,
        { expand: ['refunds.data'] },
        accountId ? { stripeAccount: accountId } : undefined
      )
      charge = hydrated as any
    }
    const withMeta = (charge.refunds?.data || []).find((r) => (r.metadata as any)?.purchase_guid)
    if (withMeta) return { refund: withMeta, accountId }
    const last = (charge.refunds?.data || []).slice().sort((a,b)=>(a.created||0)-(b.created||0)).at(-1)
    if (last) {
      const full = await stripe.refunds.retrieve(last.id, {}, accountId ? { stripeAccount: accountId } : undefined)
      return { refund: full, accountId }
    }
    throw new Error('Charge has no refunds array to extract from')
  }

  // Treat unknown events as no-op (avoid retry storms)
  throw new Error(`IGNORE_EVENT ${e.type}`)
}

export async function POST(req: NextRequest) {
  const rid = Math.random().toString(36).slice(2, 8)

  let stripe: Stripe
  try { stripe = getStripe() }
  catch (e: any) {
    console.error(`[wh ${rid}] Stripe init failed: ${e?.message || e}`)
    return new NextResponse('Stripe not configured', { status: 500 })
  }

  if (!webhookSecret) {
    console.error(`[wh ${rid}] STRIPE_WEBHOOK_SECRET missing`)
    return new NextResponse('Webhook secret missing', { status: 500 })
  }

  const signature = req.headers.get('stripe-signature') as string
  const rawBody = await req.text()

  let event: Stripe.Event
  try { event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret) }
  catch (err: any) {
    console.error(`[wh ${rid}] constructEvent failed`, err?.message || err)
    return new NextResponse(`Webhook Error: ${err?.message || 'invalid signature'}`, { status: 400 })
  }

  // --- Process ---
  try {
    const { refund, accountId } = await extractRefundFromEvent(event, stripe)

    const paymentIntentId = typeof refund.payment_intent === 'string' ? refund.payment_intent : undefined
    const refundId = refund.id
    const amountMajor = (refund.amount ?? 0) / 100
    const purchaseGuid = String(refund.metadata?.purchase_guid ?? '')
    const raffleGuid = String(refund.metadata?.raffle_guid ?? '')
    const note = String(refund.metadata?.admin_note ?? 'Webhook refund')
    const Dt_Credit = formatAsSqlDatetimeFromUnixSeconds(refund.created || Math.floor(Date.now()/1000))

    console.log(`[wh ${rid}] refund event`, {
      type: event.type, account: accountId, refundId, paymentIntentId, purchaseGuid, raffleGuid, amountMajor, status: refund.status,
    })

    if (!purchaseGuid) return NextResponse.json({ received: true, rid, ignored: 'missing_purchase_guid' }) // 200 ignore
    if (!paymentIntentId) return NextResponse.json({ received: true, rid, ignored: 'missing_payment_intent' }) // 200 ignore

    // --- De-dupe keys ---
    const keyByRefund = `refund:${refundId}`
    const keyByPI = `pi:${paymentIntentId}`
    if (recentlyProcessed(keyByRefund) || recentlyProcessed(keyByPI)) {
      console.log(`[wh ${rid}] dedupe: already processed`, { keyByRefund, keyByPI })
      return NextResponse.json({ received: true, rid, deduped: true })
    }

    // Build payload
    const payload = {
      Guid_RaffleId: raffleGuid,
      Guid_RefundId: paymentIntentId, // your rule: 1 refund per PI/purchase
      Dec_Refund: amountMajor,
      Dt_Credit,
      VC_Note: note,
    }

    // Backend JWT
    const jwt = await getBackendJWTFromApp()

    // PUT to backend (include Idempotency-Key)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '')
    if (!apiUrl) throw new Error('Missing NEXT_PUBLIC_API_URL')
    const url = `${apiUrl}/Refund/${encodeURIComponent(purchaseGuid)}`
    const outHeaders = { 'Content-Type': 'application/json', Authorization: 'Bearer <redacted>' }
    console.log(`[wh ${rid}] PUT ${url}`)
    console.log(`[wh ${rid}] headers`, outHeaders)
    console.log(`[wh ${rid}] body`, payload)

    let res: Response
    let text = ''
    try {
      console.time(`[wh ${rid}] PUT duration`)
      res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
          'X-Request-Id': rid,
          'Idempotency-Key': `refund-${refundId}`,   // <-- help your backend dedupe
        },
        body: JSON.stringify(payload),
        cache: 'no-store',
      })
      console.timeEnd(`[wh ${rid}] PUT duration`)
      text = await res.text().catch(() => '')
    } catch (e: any) {
      console.error(`[wh ${rid}] PUT network error`, e?.message || e)
      return new NextResponse('Backend PUT network error', { status: 502 })
    }

    let json: any = null
    try { json = text ? JSON.parse(text) : null } catch {}

    console.log(`[wh ${rid}] backend response`, { status: res.status, body: json ?? text ?? '(empty)' })

    if (!res.ok) return new NextResponse(`Backend PUT failed: ${res.status} ${text}`, { status: 500 })
    if (json && typeof json.err_Code === 'number' && json.err_Code !== 0) {
      // 999 or other backend error → ask Stripe to retry
      return new NextResponse(`Backend err_Code ${json.err_Code}: ${json.message ?? 'Unknown error'}`, { status: 500 })
    }

    // Success → mark de-dupe keys so subsequent events in the burst do nothing
    markProcessed(keyByRefund)
    markProcessed(keyByPI)

    const ok = NextResponse.json({ received: true, rid })
    ok.headers.set('X-Request-Id', rid)
    return ok
  } catch (err: any) {
    const msg = String(err?.message || 'unknown')
    // If we deliberately threw with IGNORE_EVENT, return 200 to stop retries
    if (msg.startsWith('IGNORE_EVENT')) {
      console.log(`[wh ${rid}] ignore ${msg}`)
      return NextResponse.json({ received: true, rid, ignored: msg })
    }
    console.error(`[wh ${rid}] handler error`, msg)
    return new NextResponse(`Handler Error: ${msg}`, { status: 500 })
  }
}