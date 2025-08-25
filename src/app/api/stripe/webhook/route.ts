// app/api/stripe/webhook/route.ts
import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import { getStripe } from '@/lib/stripe-server'
import Stripe from 'stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

async function signServiceJWT(claims: Record<string, any> = {}) {
  const secret = process.env.BACKEND_JWT_SECRET
  if (!secret) throw new Error('Missing BACKEND_JWT_SECRET')
  const key = new TextEncoder().encode(secret)
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: process.env.BACKEND_JWT_ISS || 'gh-admin',
    aud: process.env.BACKEND_JWT_AUD || 'gh-backend',
    iat: now,
    nbf: now,
    exp: now + 5 * 60,
    ...claims,
  }
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(payload.iat)
    .setNotBefore(payload.nbf)
    .setExpirationTime(payload.exp)
    .setAudience(payload.aud)
    .setIssuer(payload.iss)
    .sign(key)
}

type RefundSucceededEvent = {
  id: string
  type: 'refund.succeeded'
  data: { object: Stripe.Refund }
  account?: string
}

function isRefundSucceeded(e: any): e is RefundSucceededEvent {
  return e && e.type === 'refund.succeeded' && e.data?.object?.object === 'refund'
}

function formatAsSqlDatetimeFromUnixSeconds(unixSecs: number): string {
  const d = new Date(unixSecs * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(
    d.getUTCMinutes()
  )}:${pad(d.getUTCSeconds())}`
}

export async function POST(req: NextRequest) {
  const rid = Math.random().toString(36).slice(2, 8)

  // Init Stripe (lazy)
  let stripe: Stripe
  try {
    stripe = getStripe()
  } catch (e: any) {
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
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err: any) {
    console.error(`[wh ${rid}] constructEvent failed`, err?.message || err)
    return new NextResponse(`Webhook Error: ${err?.message || 'invalid signature'}`, { status: 400 })
  }

  try {
    if (isRefundSucceeded(event)) {
      const refundEvent = event as RefundSucceededEvent
      const refund = refundEvent.data.object
      const amountMajor = (refund.amount ?? 0) / 100
      const purchaseGuid = String(refund.metadata?.purchase_guid ?? '')
      const raffleGuid = String(refund.metadata?.raffle_guid ?? '')
      const note = String(refund.metadata?.admin_note ?? 'Webhook refund')
      const paymentIntentId = typeof refund.payment_intent === 'string' ? refund.payment_intent : undefined
      const Dt_Credit = formatAsSqlDatetimeFromUnixSeconds(refund.created)

      console.log(`[wh ${rid}] refund.succeeded`, {
        eventId: refundEvent.id,
        refundId: refund.id,
        paymentIntentId,
        purchaseGuid,
        raffleGuid,
        amountMajor,
      })

      if (!purchaseGuid) throw new Error('Missing purchase_guid in refund metadata')
      if (!paymentIntentId) throw new Error('Missing payment_intent on refund object')

      const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '')
      if (!apiUrl) throw new Error('Missing NEXT_PUBLIC_API_URL')

      const payload = {
        Guid_RaffleId: raffleGuid,
        Guid_RefundId: paymentIntentId, // if your backend expects PI here
        Dec_Refund: amountMajor,
        Dt_Credit,
        VC_Note: note,
      }

      const jwt = await signServiceJWT({ scope: 'refund:write' })
      const url = `${apiUrl}/Refund/${encodeURIComponent(purchaseGuid)}`

      console.log(`[wh ${rid}] PUT ${url}`, { payload })

      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify(payload),
      })

      const text = await res.text().catch(() => '')
      let json: any = null
      try {
        json = text ? JSON.parse(text) : null
      } catch {}

      console.log(`[wh ${rid}] backend response`, {
        status: res.status,
        body: json ?? text ?? '(empty)',
      })

      if (!res.ok) throw new Error(`Backend PUT failed: ${res.status} ${text}`)
      if (json && typeof json.err_Code === 'number' && json.err_Code !== 0) {
        throw new Error(`Backend err_Code ${json.err_Code}: ${json.message ?? 'Unknown error'}`)
      }
    }

    const ok = NextResponse.json({ received: true, rid })
    ok.headers.set('X-Request-Id', rid)
    return ok
  } catch (err: any) {
    console.error(`[wh ${rid}] handler error`, err?.message || err)
    return new NextResponse(`Handler Error: ${err?.message || 'unknown'}`, { status: 500 })
  }
}