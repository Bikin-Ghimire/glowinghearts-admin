// app/api/pwd/reset/route.ts
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { VC_Email } = await req.json()
    if (!VC_Email) {
      return NextResponse.json({ err_Code: 1, message: 'Email required.' }, { status: 400 })
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/pwd/reset/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ VC_Email }),
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err: any) {
    return NextResponse.json({ err_Code: 2, message: 'Unexpected error.' }, { status: 500 })
  }
}