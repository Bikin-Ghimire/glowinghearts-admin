import { stripe } from '@/lib/stripe-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { accountId } = await req.json()

    const account = await stripe.accounts.retrieve(accountId, { expand: ['capabilities'] })

    return NextResponse.json({
      charges_enabled: account.charges_enabled,
      details_submitted: account.details_submitted,
      payouts_enabled: account.payouts_enabled,
      card_payments: account.capabilities?.card_payments,
      transfers: account.capabilities?.transfers,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}