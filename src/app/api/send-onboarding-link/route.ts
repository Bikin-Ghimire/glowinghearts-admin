import { authOptions } from '@/app/api/auth/[...nextauth]/route' // ✅ adjust if path differs
import { getTokenFromSession } from '@/hooks/use-session-token'
import { sendEmail } from '@/lib/email' // your email utility
import { stripe } from '@/lib/utils'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const token = await getTokenFromSession(session)

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email, charityName, charityId } = await req.json()

    if (!email || !charityId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 1. Create the Connect account
    const account = await stripe.accounts.create({
      type: 'express',
      email,
      business_type: 'non_profit',
    })

    const charityRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Charities/${charityId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const charity = await charityRes.json()

    // TODO: Save account.id to DB using your internal API
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Charities/${charityId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        VC_CharityDesc: charity?.obj_Charities[0].VC_CharityDesc,
        Txt_CharityDesc: charity?.obj_Charities[0].Txt_CharityDesc,
        VC_ContactFirstName: charity?.obj_Charities[0].VC_ContactFirstName,
        VC_ContactLastName: charity?.obj_Charities[0].VC_ContactLastName,
        VC_ContactEmail: charity?.obj_Charities[0].VC_ContactEmail,
        VC_ContactPhone: charity?.obj_Charities[0].VC_ContactPhone,
        VC_CharityKey: account.id,
      }),
    })
    console.log('API returned:', charity)

    // 2. Generate the onboarding link
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_BASE_URL
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${origin}/stripe/onboarding/refresh`,
      return_url: `${origin}/stripe/onboarding/complete`,
      type: 'account_onboarding',
    })

    // 3. Send the email
    await sendEmail({
      to: email,
      subject: `Complete your Stripe onboarding for Glowing Hearts Fundraising`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #333;">Welcome to Glowing Hearts Fundraising Portal</h2>
        <p style="font-size: 16px; color: #444;">
            Hi there,
        </p>
        <p style="font-size: 16px; color: #444;">
            To start receiving funds from raffle ticket sales, please complete your onboarding with Stripe.
        </p>
        <div style="text-align: center; margin: 24px 0;">
            <a href="${accountLink.url}" target="_blank" style="background-color: #8b5cf6; color: white; padding: 14px 24px; text-decoration: none; border-radius: 6px; font-size: 16px;">
            Complete Stripe Onboarding
            </a>
        </div>
        <p style="font-size: 16px; color: #444;">
            Please note that the link will expire in 7 days or after you complete / cancel the onboarding process. If you need another link, you can request it again.
        </p>
        <p style="font-size: 14px; color: #666;">
            If you have any questions, feel free to reach out to us.
        </p>
        <p style="font-size: 14px; color: #666;">
            — Glowing Hearts Fundraising Team
        </p>
        </div>
  `,
    })

    return NextResponse.json({ success: true, accountId: account.id })
  } catch (error: any) {
    console.error('Stripe onboarding error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
