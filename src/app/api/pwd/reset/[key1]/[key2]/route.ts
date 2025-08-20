// app/api/pwd/reset/[key1]/[key2]/route.ts
import { NextResponse } from 'next/server'

type Params = { params: { key1: string; key2: string } }

export async function POST(req: Request, { params }: Params) {
  const { key1, key2 } = params
  try {
    const { VC_Pwd } = await req.json()
    if (!VC_Pwd) {
      return NextResponse.json({ err_Code: 1, message: 'Password required.' }, { status: 400 })
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/pwd/reset/${key1}/${key2}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ VC_Pwd }),
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err: any) {
    return NextResponse.json({ err_Code: 2, message: 'Unexpected error.' }, { status: 500 })
  }
}