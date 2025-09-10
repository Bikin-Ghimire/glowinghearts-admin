// app/api/trust-device/route.ts
import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const TRUSTED_DEVICE_DAYS = 30
const isProd = process.env.NODE_ENV === 'production'

function cookieName(email: string) {
  const b64 = Buffer.from(email).toString('base64').replace(/=+$/,'')
  return `__Host_trust_${b64}`
}
function sign(value: object, days = TRUSTED_DEVICE_DAYS) {
  const secret = process.env.NEXTAUTH_SECRET || 'fallback'
  return jwt.sign(value, secret, { algorithm: 'HS256', expiresIn: `${days}d` })
}

export async function POST(req: Request) {
  const { email } = await req.json().catch(() => ({ email: '' }))
  if (!email) return NextResponse.json({ ok: false, error: 'email required' }, { status: 400 })

  const ua = (req.headers.get('user-agent') || '').slice(0, 200)
  const token = sign({ ok: true, ua })

  const res = NextResponse.json({ ok: true })
  res.cookies.set(cookieName(email), token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * TRUSTED_DEVICE_DAYS,
  })
  return res
}