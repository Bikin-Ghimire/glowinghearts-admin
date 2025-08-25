// app/api/send-onboarding-link/route.ts
import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe-server'
import { getTokenFromSessionSafe } from '@/lib/api-bearer'

// Stripe SDK isn’t Edge-safe
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function jsonError(message: string, status = 400, rid?: string) {
  const res = NextResponse.json({ ok: false, error: message, rid }, { status })
  if (rid) res.headers.set('X-Request-Id', rid)
  return res
}

export async function POST(req: NextRequest) {
  const rid = Math.random().toString(36).slice(2, 8)
  console.log(`[${rid}] send-onboarding-link hit`)

  try {
    // --- 0) Env checks ---
    const API_URL = process.env.NEXT_PUBLIC_API_URL
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL
    if (!API_URL) {
      console.error(`[${rid}] Missing env: NEXT_PUBLIC_API_URL`)
      return jsonError('Server misconfig: API URL not set', 500, rid)
    }

    // Stripe init (lazy + typed)
    let stripe: ReturnType<typeof getStripe>
    try {
      stripe = getStripe()
    } catch (e: any) {
      console.error(`[${rid}] Stripe init failed: ${e?.message || e}`)
      return jsonError('Server misconfig: Stripe not configured', 500, rid)
    }

    // --- 1) Auth / token (server-safe) ---
    const token = await getTokenFromSessionSafe(rid)
    if (!token) {
      console.warn(`[${rid}] Unauthorized: missing session email/password`)
      return jsonError('Unauthorized', 401, rid)
    }

    // --- 2) Parse body ---
    let body: { email?: string; charityName?: string; charityId?: string }
    try {
      body = await req.json()
    } catch {
      return jsonError('Invalid JSON body', 400, rid)
    }
    const { email, charityName, charityId } = body
    if (!email || !charityId) {
      return jsonError('Missing required fields: email, charityId', 400, rid)
    }

    // --- 3) Create Stripe Connect Account ---
    let account
    try {
      account = await stripe.accounts.create({
        type: 'express',
        email,
        business_type: 'non_profit', // change to 'company' if appropriate
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      })
      console.log(`[${rid}] Stripe account created: ${account.id}`)
    } catch (err: any) {
      console.error(
        `[${rid}] stripe.accounts.create failed`,
        err?.raw ? { type: err.raw.type, code: err.raw.code, message: err.raw.message } : err
      )
      return jsonError(`Stripe error: ${err?.raw?.message || err.message}`, 502, rid)
    }

    // --- 4) GET charity from your backend ---
    const charityGetUrl = `${API_URL.replace(/\/$/, '')}/Charities/${encodeURIComponent(charityId)}`
    let charityRes: Response
    try {
      charityRes = await fetch(charityGetUrl, {
        headers: { Authorization: token },
        cache: 'no-store',
      })
    } catch (e: any) {
      console.error(`[${rid}] GET ${charityGetUrl} network error`, e?.message || e)
      return jsonError('Failed to reach backend API (GET charity)', 502, rid)
    }
    if (!charityRes.ok) {
      const text = await charityRes.text().catch(() => '')
      console.error(`[${rid}] GET ${charityGetUrl} -> ${charityRes.status}`, text)
      return jsonError(`Backend API error (get charity): ${charityRes.status}`, 502, rid)
    }
    const charityJson = await charityRes.json().catch((e) => {
      console.error(`[${rid}] GET charity JSON parse error`, e)
      return null
    })
    const existing = charityJson?.obj_Charities?.[0]
    if (!existing) {
      console.error(`[${rid}] Charity not found in API response`, charityJson)
      return jsonError('Charity not found', 404, rid)
    }

    // --- 5) PUT charity with Stripe account id ---
    const charityPutUrl = `${API_URL.replace(/\/$/, '')}/Charities/${encodeURIComponent(charityId)}`
    const putPayload = {
      VC_CharityDesc: existing.VC_CharityDesc ?? '',
      Txt_CharityDesc: existing.Txt_CharityDesc ?? '',
      VC_ContactFirstName: existing.VC_ContactFirstName ?? '',
      VC_ContactLastName: existing.VC_ContactLastName ?? '',
      VC_ContactEmail: existing.VC_ContactEmail ?? email,
      VC_ContactPhone: existing.VC_ContactPhone ?? '',
      VC_CharityKey: account.id, // Stripe Account ID
    }

    let putRes: Response
    try {
      putRes = await fetch(charityPutUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token,
        },
        body: JSON.stringify(putPayload),
      })
    } catch (e: any) {
      console.error(`[${rid}] PUT ${charityPutUrl} network error`, e?.message || e)
      return jsonError('Failed to reach backend API (save Stripe id)', 502, rid)
    }
    if (!putRes.ok) {
      const text = await putRes.text().catch(() => '')
      console.error(`[${rid}] PUT ${charityPutUrl} -> ${putRes.status}`, text)
      return jsonError(`Backend API error (save Stripe id): ${putRes.status}`, 502, rid)
    }

    // --- 6) Create onboarding link ---
    const base = (() => {
      const origin = req.headers.get('origin') || BASE_URL || 'http://localhost:3001'
      if (!/^https?:\/\//i.test(origin)) {
        console.warn(`[${rid}] Invalid origin "${origin}" — using http://localhost:3001 fallback`)
        return 'http://localhost:3001'
      }
      return origin
    })()

    let accountLink
    try {
      accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${base}/stripe/onboarding/refresh`,
        return_url: `${base}/stripe/onboarding/complete`,
        type: 'account_onboarding',
      })
      console.log(`[${rid}] Onboarding link created`)
    } catch (err: any) {
      console.error(
        `[${rid}] stripe.accountLinks.create failed`,
        err?.raw ? { type: err.raw.type, code: err.raw.code, message: err.raw.message } : err
      )
      return jsonError(`Stripe error: ${err?.raw?.message || err.message}`, 502, rid)
    }

    // --- 7) Email (lazy import; never fatal) ---
    try {
      const emailMod = await import('@/lib/email').catch(() => null)
      const sendEmail = emailMod?.sendEmail
      if (!sendEmail) {
        console.warn(`[${rid}] email module not available; skipping email`)
      } else {
        const result = await sendEmail({
          to: email,
          subject: `Complete your Stripe onboarding for Glowing Hearts Fundraising`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #eee; border-radius: 8px;">
              <h2 style="color: #333;">Welcome to Glowing Hearts Fundraising Portal</h2>
              <p style="font-size: 16px; color: #444;">Hi${charityName ? ` ${charityName}` : ''},</p>
              <p style="font-size: 16px; color: #444;">To start receiving funds from raffle ticket sales, please complete your onboarding with Stripe.</p>
              <div style="text-align: center; margin: 24px 0;">
                <a href="${accountLink.url}" target="_blank" style="background-color: #8b5cf6; color: white; padding: 14px 24px; text-decoration: none; border-radius: 6px; font-size: 16px;">
                  Complete Stripe Onboarding
                </a>
              </div>
              <p style="font-size: 16px; color: #444;">This link expires after it’s used or if it times out. If you need another link, reply to this email.</p>
              <p style="font-size: 14px; color: #666;">— Glowing Hearts Fundraising Team</p>
            </div>
          `,
        })
        if ((result as any)?.skipped) {
          console.warn(`[${rid}] email skipped: ${(result as any).reason}`)
        }
      }
    } catch (e: any) {
      console.error(`[${rid}] sendEmail failed`, e?.message || e)
    }

    const res = NextResponse.json({ ok: true, accountId: account.id, link: accountLink.url, rid })
    res.headers.set('X-Request-Id', rid)
    return res
  } catch (error: any) {
    console.error(`[${rid}] [unhandled]`, error?.stack || error)
    return jsonError(error?.message || 'Internal error', 500, rid)
  }
}