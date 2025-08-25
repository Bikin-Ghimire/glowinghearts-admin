// lib/stripe-server.ts
import 'server-only'
import Stripe from 'stripe'

// pin to a stable version unless you need a newer API
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
})