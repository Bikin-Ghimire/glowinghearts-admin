// src/app/api/create-jwt/route.ts

import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export async function POST(req: Request) {
  const { VC_Email, VC_Pwd } = await req.json()

  const token = jwt.sign(
    { VC_Email, VC_Pwd },
    process.env.JWT_SECRET!,
    { algorithm: 'HS256', expiresIn: '10m' }
  )

  return NextResponse.json({ token })
}