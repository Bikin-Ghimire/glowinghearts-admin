// src/app/api/resend-onboarding-link/route.ts
import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { getStripe } from '@/lib/stripe-server'
import { getTokenFromSessionSafe } from '@/lib/api-bearer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function jsonError(message: string, status = 400, rid?: string) {
  const res = NextResponse.json({ ok: false, error: message, rid }, { status })
  if (rid) res.headers.set('X-Request-Id', rid)
  return res
}

export async function POST(req: NextRequest) {
  const rid = Math.random().toString(36).slice(2, 8)
  console.log(`[${rid}] resend-onboarding-link hit`)

  try {
    // Init Stripe lazily
    let stripe
    try {
      stripe = getStripe()
    } catch (e: any) {
      console.error(`[${rid}] Stripe init failed: ${e?.message || e}`)
      return jsonError('Server misconfig: Stripe not configured', 500, rid)
    }

    // Auth
    const token = await getTokenFromSessionSafe()
    if (!token) {
      console.warn(`[${rid}] Unauthorized: no session token`)
      return jsonError('Unauthorized', 401, rid)
    }

    // Body
    let body: { email?: string; charityId?: string; stripeAccountId?: string }
    try {
      body = await req.json()
    } catch {
      return jsonError('Invalid JSON body', 400, rid)
    }
    const { email, charityId, stripeAccountId } = body
    if (!email || !charityId) return jsonError('Missing required fields: email, charityId', 400, rid)
    if (!stripeAccountId) return jsonError('Missing Stripe Account ID on charity', 400, rid)

    // Origin
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'
    if (!/^https?:\/\//i.test(origin)) {
      console.warn(`[${rid}] Invalid origin (${origin}); using http://localhost:3001 fallback`)
    }

    // New account link
    let accountLink
    try {
      accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: `${origin}/stripe/onboarding/refresh`,
        return_url: `${origin}/stripe/onboarding/complete`,
        type: 'account_onboarding',
      })
      console.log(`[${rid}] Onboarding link re-created for ${stripeAccountId}`)
    } catch (err: any) {
      console.error(
        `[${rid}] Stripe accountLinks.create failed`,
        err?.raw ? { type: err.raw.type, code: err.raw.code, message: err.raw.message } : err
      )
      return jsonError(`Stripe error: ${err?.raw?.message || err.message}`, 502, rid)
    }

    // Email (lazy)
    try {
      const emailMod = await import('@/lib/email').catch(() => null)
      const sendEmail = emailMod?.sendEmail
      if (!sendEmail) {
        console.warn(`[${rid}] email module not available; skipping email`)
      } else {
        const result = await sendEmail({
          to: email,
          subject: `Resume your Stripe onboarding for Glowing Hearts Fundraising`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #eee; border-radius: 8px;">
              <h2 style="color: #333;">Complete your Stripe onboarding</h2>
              <p style="font-size: 16px; color: #444;">Hi there,</p>
              <p style="font-size: 16px; color: #444;">
                It looks like your onboarding is not complete. To ensure you receive funds from raffle sales, please resume your onboarding with Stripe:
              </p>
              <div style="text-align: center; margin: 24px 0;">
                <a href="${accountLink.url}" target="_blank" style="background-color: #8b5cf6; color: white; padding: 14px 24px; text-decoration: none; border-radius: 6px; font-size: 16px;">
                  Resume Stripe Onboarding
                </a>
              </div>
              <p style="font-size: 14px; color: #666;">This link will expire after it’s used or times out. You can always request another if needed.</p>
              <p style="font-size: 14px; color: #666;">— Glowing Hearts Fundraising Team</p>
            </div>
          `,
        })
        if ((result as any)?.skipped) {
          console.warn(`[${rid}] email skipped: ${(result as any).reason}`)
        }
      }
    } catch (e) {
      console.error(`[${rid}] sendEmail failed`, e)
    }

    const res = NextResponse.json({ ok: true, accountId: stripeAccountId, link: accountLink.url, rid })
    res.headers.set('X-Request-Id', rid)
    return res
  } catch (error: any) {
    console.error(`[${rid}] [unhandled]`, error?.stack || error)
    return jsonError(error?.message || 'Internal error', 500, rid)
  }
}