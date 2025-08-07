import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { getTokenFromSession } from '@/hooks/use-session-token'
import { sendEmail } from '@/lib/email'
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

    const { email, charityId, stripeAccountId } = await req.json()

    if (!email || !charityId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 1. Get current charity details
    // const charityRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Charities/${charityId}`, {
    //   headers: { Authorization: `Bearer ${token}` },
    // })
    // const charity = await charityRes.json()

    if (!stripeAccountId) {
      return NextResponse.json({ error: 'Missing Stripe Account ID on charity' }, { status: 400 })
    }

    // 2. Generate a new onboarding link for existing Stripe account
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_BASE_URL
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${origin}/stripe/onboarding/refresh`,
      return_url: `${origin}/stripe/onboarding/complete`,
      type: 'account_onboarding',
    })

    // 3. Send the email
    await sendEmail({
      to: email,
      subject: `Resume your Stripe onboarding for Glowing Hearts Fundraising`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #333;">Complete your Stripe onboarding</h2>
          <p style="font-size: 16px; color: #444;">
            Hi there,
          </p>
          <p style="font-size: 16px; color: #444;">
            It looks like your onboarding is not complete. To ensure you receive funds from raffle sales, please resume your onboarding with Stripe:
          </p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${accountLink.url}" target="_blank" style="background-color: #8b5cf6; color: white; padding: 14px 24px; text-decoration: none; border-radius: 6px; font-size: 16px;">
              Resume Stripe Onboarding
            </a>
          </div>
          <p style="font-size: 14px; color: #666;">
            This link will expire in 7 days or after completion. You can always request another if needed.
          </p>
          <p style="font-size: 14px; color: #666;">— Glowing Hearts Fundraising Team</p>
        </div>
      `,
    })

    return NextResponse.json({ success: true, accountId: stripeAccountId })
  } catch (error: any) {
    console.error('Resend onboarding error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
