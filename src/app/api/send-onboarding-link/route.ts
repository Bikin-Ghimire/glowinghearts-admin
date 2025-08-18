// app/api/send-onboarding-link/route.ts
import { authOptions } from '@/lib/auth-options'
import { getTokenFromSession } from '@/hooks/use-session-token'
import { sendEmail } from '@/lib/email'
import { stripe } from '@/lib/utils'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

// Ensure we’re on the Node runtime (Stripe SDK isn’t Edge-safe)
export const runtime = 'nodejs'

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status })
}

export async function POST(req: NextRequest) {
  // Helpful request id for correlating logs
  const rid = Math.random().toString(36).slice(2, 8)

  try {
    // --- 0) Env checks (common cause of "fetch failed") ---
    const API_URL = process.env.NEXT_PUBLIC_API_URL
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL
    if (!API_URL) {
      console.error(`[${rid}] Missing env: NEXT_PUBLIC_API_URL`)
      return jsonError('Server misconfig: API URL not set', 500)
    }
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error(`[${rid}] Missing env: STRIPE_SECRET_KEY`)
      return jsonError('Server misconfig: Stripe not configured', 500)
    }

    // --- 1) Auth / token ---
    const session = await getServerSession(authOptions)
    const token = await getTokenFromSession(session)
    if (!token) return jsonError('Unauthorized', 401)

    // --- 2) Parse body ---
    let body: { email?: string; charityName?: string; charityId?: string }
    try {
      body = await req.json()
    } catch {
      return jsonError('Invalid JSON body')
    }
    const { email, charityName, charityId } = body
    if (!email || !charityId) return jsonError('Missing required fields: email, charityId')

    // --- 3) Create Stripe Connect Account (capture rich errors) ---
    let account
    try {
      account = await stripe.accounts.create({
        type: 'express',
        email,
        business_type: 'non_profit', // ok if they’re actually a non-profit; otherwise consider 'company'
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      })
    } catch (err: any) {
      console.error(
        `[${rid}] Stripe accounts.create failed`,
        err?.raw ? { type: err.raw.type, code: err.raw.code, message: err.raw.message } : err
      )
      return jsonError(`Stripe error: ${err?.raw?.message || err.message}`, 502)
    }

    // --- 4) Fetch charity (read) ---
    const charityGetUrl = `${API_URL.replace(/\/$/, '')}/Charities/${charityId}`
    const charityRes = await fetch(charityGetUrl, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    }).catch((e) => {
      console.error(`[${rid}] GET ${charityGetUrl} network error`, e)
      return null
    })

    if (!charityRes) return jsonError('Failed to reach backend API (GET charity)', 502)
    if (!charityRes.ok) {
      const text = await charityRes.text().catch(() => '')
      console.error(`[${rid}] GET ${charityGetUrl} -> ${charityRes.status}`, text)
      return jsonError(`Backend API error (get charity): ${charityRes.status}`, 502)
    }

    const charityJson = await charityRes.json().catch((e) => {
      console.error(`[${rid}] GET charity JSON parse error`, e)
      return null
    })
    const existing = charityJson?.obj_Charities?.[0]
    if (!existing) {
      console.error(`[${rid}] Charity not found in API response`, charityJson)
      return jsonError('Charity not found', 404)
    }

    // --- 5) Save Stripe account id into charity record (PUT) ---
    const charityPutUrl = `${API_URL.replace(/\/$/, '')}/Charities/${charityId}`
    const putPayload = {
      VC_CharityDesc: existing.VC_CharityDesc ?? '',
      Txt_CharityDesc: existing.Txt_CharityDesc ?? '',
      VC_ContactFirstName: existing.VC_ContactFirstName ?? '',
      VC_ContactLastName: existing.VC_ContactLastName ?? '',
      VC_ContactEmail: existing.VC_ContactEmail ?? email,
      VC_ContactPhone: existing.VC_ContactPhone ?? '',
      VC_CharityKey: account.id, // << Stripe Account ID
    }

    const putRes = await fetch(charityPutUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(putPayload),
    }).catch((e) => {
      console.error(`[${rid}] PUT ${charityPutUrl} network error`, e)
      return null
    })

    if (!putRes) return jsonError('Failed to reach backend API (save Stripe id)', 502)
    if (!putRes.ok) {
      const text = await putRes.text().catch(() => '')
      console.error(`[${rid}] PUT ${charityPutUrl} -> ${putRes.status}`, text)
      return jsonError(`Backend API error (save Stripe id): ${putRes.status}`, 502)
    }

    // --- 6) Create onboarding link (origin must be absolute https) ---
    const originHeader = req.headers.get('origin')
    const origin = originHeader || BASE_URL
    if (!origin || !/^https?:\/\//i.test(origin)) {
      console.warn(`[${rid}] Missing/invalid origin; using fallback http(s)://localhost:3001`)
    }
    const base = origin || 'http://localhost:3001' // dev fallback

    let accountLink
    try {
      accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${base}/stripe/onboarding/refresh`,
        return_url: `${base}/stripe/onboarding/complete`,
        type: 'account_onboarding',
      })
    } catch (err: any) {
      console.error(
        `[${rid}] Stripe accountLinks.create failed`,
        err?.raw ? { type: err.raw.type, code: err.raw.code, message: err.raw.message } : err
      )
      return jsonError(`Stripe error: ${err?.raw?.message || err.message}`, 502)
    }

    // --- 7) Send email (don’t fail the whole flow if email provider flakes) ---
    try {
      await sendEmail({
        to: email,
        subject: `Complete your Stripe onboarding for Glowing Hearts Fundraising`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #eee; border-radius: 8px;">
            <h2 style="color: #333;">Welcome to Glowing Hearts Fundraising Portal</h2>
            <p style="font-size: 16px; color: #444;">Hi${charityName ? ` ${charityName}` : ''},</p>
            <p style="font-size: 16px; color: #444;">
              To start receiving funds from raffle ticket sales, please complete your onboarding with Stripe.
            </p>
            <div style="text-align: center; margin: 24px 0;">
              <a href="${accountLink.url}" target="_blank" style="background-color: #8b5cf6; color: white; padding: 14px 24px; text-decoration: none; border-radius: 6px; font-size: 16px;">
                Complete Stripe Onboarding
              </a>
            </div>
            <p style="font-size: 16px; color: #444;">
              This link expires after it’s used or if it times out. If you need another link, reply to this email.
            </p>
            <p style="font-size: 14px; color: #666;">— Glowing Hearts Fundraising Team</p>
          </div>
        `,
      })
    } catch (e) {
      console.error(`[${rid}] sendEmail failed`, e)
      // still return success (onboarding link created & account saved)
    }

    return NextResponse.json({ ok: true, accountId: account.id, link: accountLink.url, rid })
  } catch (error: any) {
    // Catch-all: log stack and raw error data so Vercel logs are useful
    console.error('[unhandled]', error?.stack || error)
    return NextResponse.json(
      { ok: false, error: error?.message || 'Internal error' },
      { status: 500 }
    )
  }
}
