import { sendEmail } from '@/lib/email' // your email utility
import { stripe } from '@/lib/utils'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { email, charityName } = await req.json()

    // 1. Create the Connect account
    const account = await stripe.accounts.create({
      type: 'express',
      email,
      business_type: 'non_profit',
    })

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
      subject: `Complete your Stripe onboarding for ${charityName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #333;">Welcome to Matt's Mats Partner Portal</h2>
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
