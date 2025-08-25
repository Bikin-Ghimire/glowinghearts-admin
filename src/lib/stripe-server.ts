// src/lib/stripe-server.ts
import 'server-only'
import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (_stripe) return _stripe

  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    // Throw here so the route can catch and return a structured 500
    throw new Error('STRIPE_SECRET_KEY is missing')
  }

  // Typings will pin to the latest literal; cast to allow a pinned runtime version.
  _stripe = new Stripe(key, {
    apiVersion: '2023-10-16' as unknown as Stripe.LatestApiVersion,
  })

  return _stripe
}