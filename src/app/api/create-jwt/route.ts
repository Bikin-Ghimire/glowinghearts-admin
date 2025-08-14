// src/app/api/create-jwt/route.ts
import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const { VC_Email, VC_Pwd } = await req.json()
  if (!VC_Email || !VC_Pwd) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
  }
  const secret = process.env.JWT_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'JWT_SECRET not set' }, { status: 500 })
  }
  const token = jwt.sign({ VC_Email, VC_Pwd }, secret, {
    algorithm: 'HS256',
    expiresIn: '10m',
  })
  return NextResponse.json({ token })
}