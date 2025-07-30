import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { account } = body;

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const accountLink = await stripe.accountLinks.create({
      account: account,
      refresh_url: `${origin}/refresh/${account}`,
      return_url: `${origin}/return/${account}`,
      type: 'account_onboarding',
    });

    return NextResponse.json({
      url: accountLink.url,
    });
  } catch (error: any) {
    console.error(
      'An error occurred when calling the Stripe API to create an account link:',
      error
    );
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}