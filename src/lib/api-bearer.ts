// src/lib/api-bearer.ts
import 'server-only'
import jwt from 'jsonwebtoken'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'

export function buildApiBearerFromCreds(email: string, password: string) {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET env not set')
  // Match your authorize() logic: HS256, 10m expiry
  const token = jwt.sign({ VC_Email: email, VC_Pwd: password }, secret, {
    algorithm: 'HS256',
    expiresIn: '10m',
  })
  return `Bearer ${token}`
}

/**
 * Reads email+password from the NextAuth session (as you populate them in callbacks.session),
 * and returns the backend Authorization header value: "Bearer <jwt>"
 * Returns null if missing.
 */
export async function getTokenFromSessionSafe(rid?: string): Promise<string | null> {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email
  // You put password onto session.user.password in callbacks.session
  const password = (session as any)?.user?.password as string | undefined

  if (!email || !password) {
    if (rid) console.warn(`[${rid}] getTokenFromSessionSafe: missing email/password on session`)
    return null
  }

  try {
    return buildApiBearerFromCreds(email, password)
  } catch (e: any) {
    if (rid) console.error(`[${rid}] getTokenFromSessionSafe: build bearer failed`, e?.message || e)
    return null
  }
}