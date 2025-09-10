// app/api/otp/request/route.ts
import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

function buildApiBearerFromCreds(email: string, password: string) {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET env not set')
  return jwt.sign({ VC_Email: email, VC_Pwd: password }, secret, {
    algorithm: 'HS256',
    expiresIn: '10m',
  })
}

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}))
  if (!email || !password) {
    return NextResponse.json({ ok: false, error: 'ERR_CHECK_FAILED' }, { status: 400 })
  }

  const base = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '')
  const url = `${base}/user/auth1/`
  const bearer = `Bearer ${buildApiBearerFromCreds(email, password)}` // header value needs "Bearer "

  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: bearer, Accept: 'application/json' },
    cache: 'no-store',
  })

  if (!r.ok) {
    const text = await r.text().catch(() => '')
    return NextResponse.json({ ok: false, error: 'ERR_CHECK_FAILED', detail: text }, { status: 400 })
  }
  return NextResponse.json({ ok: true })
}