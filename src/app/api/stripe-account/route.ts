import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe-server'

export async function POST(req: NextRequest) {
  try {
    const account = await stripe.accounts.create({});
    return NextResponse.json({ account: account.id });
  } catch (error: any) {
    console.error('An error occurred when calling the Stripe API to create an account:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}