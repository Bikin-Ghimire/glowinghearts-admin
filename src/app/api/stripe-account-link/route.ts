// app/api/stripe/account-link/route.ts
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
  console.log(`[${rid}] stripe/account-link POST hit`)

  try {
    let stripe
    try {
      stripe = getStripe()
    } catch (e: any) {
      console.error(`[${rid}] Stripe init failed: ${e?.message || e}`)
      return jsonError('Server misconfig: Stripe not configured', 500, rid)
    }

    let body: { account?: string }
    try {
      body = await req.json()
    } catch {
      return jsonError('Invalid JSON body', 400, rid)
    }

    const account = body.account?.trim()
    if (!account) return jsonError('Missing "account" (Stripe Account ID)', 400, rid)

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    if (!/^https?:\/\//i.test(origin)) {
      console.warn(`[${rid}] Invalid origin "${origin}" — using http://localhost:3000 fallback`)
    }

    const link = await stripe.accountLinks.create({
      account,
      refresh_url: `${origin}/refresh/${account}`,
      return_url: `${origin}/return/${account}`,
      type: 'account_onboarding',
    })

    console.log(`[${rid}] account link created for ${account}`)
    const res = NextResponse.json({ ok: true, url: link.url, rid })
    res.headers.set('X-Request-Id', rid)
    return res
  } catch (error: any) {
    console.error(
      `[${rid}] account link error`,
      error?.raw ? { type: error.raw.type, code: error.raw.code, message: error.raw.message } : error
    )
    return jsonError(`Stripe error: ${error?.raw?.message || error?.message || 'unknown'}`, 500, rid)
  }
}