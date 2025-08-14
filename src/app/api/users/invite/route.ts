// src/app/api/users/invite/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { randomBytes } from 'crypto'
import jwt from 'jsonwebtoken'
import { sendEmail } from '@/lib/email'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  VC_FirstName: z.string().min(1),
  VC_LastName: z.string().min(1),
  VC_Email: z.string().email(),
  // Optional overrides if you ever want to set a different default from the client:
  defaultCharityId: z.string().optional(), // defaults to "Admin Users"
  defaultAccessLevel: z.number().optional(), // defaults to 3
})

function generatePassword(length = 16) {
  const U = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const L = 'abcdefghijkmnopqrstuvwxyz'
  const D = '23456789'
  const S = '!@#$%^&*()-_=+[]{};:,.?'
  const ALL = U + L + D + S

  let pwd = [
    U[randomBytes(1)[0] % U.length],
    L[randomBytes(1)[0] % L.length],
    D[randomBytes(1)[0] % D.length],
    S[randomBytes(1)[0] % S.length],
  ].join('')
  const remaining = length - pwd.length
  const rb = randomBytes(remaining)
  for (let i = 0; i < remaining; i++) pwd += ALL[rb[i] % ALL.length]
  const arr = pwd.split('')
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomBytes(1)[0] % (i + 1)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr.join('')
}

function buildBearerFromCreds(email: string, password: string) {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET env not set')
  const token = jwt.sign({ VC_Email: email, VC_Pwd: password }, secret, {
    algorithm: 'HS256',
    expiresIn: '10m',
  })
  return `Bearer ${token}`
}

async function resolveGuidUserId({
  createData,
  email,
  tempPassword,
  apiBase,
}: {
  createData: any
  email: string
  tempPassword: string
  apiBase: string
}) {
  // Try common shapes first
  if (createData?.Guid_UserId) return String(createData.Guid_UserId)
  if (createData?.user?.Guid_UserId) return String(createData.user.Guid_UserId)

  // Fallback: call /user/Check with the new user's creds to fetch Guid_UserId
  const bearer = buildBearerFromCreds(email, tempPassword)
  const res = await fetch(`${apiBase}/user/Check`, {
    method: 'GET', // change to POST if your API uses POST
    headers: { Authorization: bearer },
    cache: 'no-store',
  })
  const data = await res.json().catch(() => null)
  if (res.ok && data?.Guid_UserId) return String(data.Guid_UserId)

  return null
}

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => ({}))
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    const {
      VC_FirstName,
      VC_LastName,
      VC_Email,
      defaultCharityId = 'Admin Users',
      defaultAccessLevel = 3,
    } = parsed.data

    // Forward admin’s token (used for /user/create and /user/access)
    const authHeader = req.headers.get('authorization') || ''
    if (!authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 })
    }

    const apiBase = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL
    if (!apiBase) {
      return NextResponse.json({ error: 'API base URL not configured' }, { status: 500 })
    }

    const tempPassword = generatePassword(16)

    // 1) Create user
    const createRes = await fetch(`${apiBase}/user/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        VC_FirstName,
        VC_LastName,
        VC_Email,
        VC_Pwd: tempPassword,
      }),
    })

    let createData: any = null
    try {
      createData = await createRes.json()
    } catch {}
    if (!createRes.ok) {
      const msg =
        (createData && (createData.message || createData.error)) ||
        `Backend create failed (${createRes.status})`
      return NextResponse.json({ error: msg }, { status: 502 })
    }

    // 2) Resolve Guid_UserId
    const guidUserId = await resolveGuidUserId({
      createData,
      email: VC_Email,
      tempPassword,
      apiBase,
    })

    // 3) Assign default access (best-effort, don’t fail the whole request)
    let accessAssigned = false
    if (guidUserId) {
      try {
        const accessRes = await fetch(`${apiBase}/user/access`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: authHeader, // admin token
          },
          body: JSON.stringify({
            Guid_UserId: guidUserId,
            Guid_CharityId: defaultCharityId,
            Int_UserAccess: defaultAccessLevel,
          }),
        })
        accessAssigned = accessRes.ok
      } catch {
        accessAssigned = false
      }
    }

    // 4) Email the user (don’t fail the whole request on email error)
    let emailSent = false
    try {
      const appName = process.env.APP_NAME || 'Glowing Hearts Admin'
      const loginUrl = process.env.NEXTAUTH_URL
        ? `${process.env.NEXTAUTH_URL.replace(/\/$/, '')}/login`
        : undefined

      const subject = `${appName}: Your account is ready`
      const text = [
        `Hi ${VC_FirstName} ${VC_LastName},`,
        ``,
        `Your admin account has been created.`,
        `Login email: ${VC_Email}`,
        `Temporary password: ${tempPassword}`,
        loginUrl ? `Login here: ${loginUrl}` : '',
        ``,
        `Please sign in and change your password immediately.`,
      ]
        .filter(Boolean)
        .join('\n')
      const html = `
        <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#111">
          <h2 style="margin:0 0 12px 0">Welcome, ${VC_FirstName} ${VC_LastName}!</h2>
          <p>Your admin account has been created.</p>
          <p><b>Login email:</b> ${VC_Email}<br/>
             <b>Temporary password:</b> ${tempPassword}</p>
          ${loginUrl ? `<p><a href="${loginUrl}">Click here to sign in</a></p>` : ''}
          <p>Please sign in and change your password immediately.</p>
        </div>
      `
      await sendEmail({ to: VC_Email, subject, text, html })
      emailSent = true
    } catch {
      emailSent = false
    }

    return NextResponse.json(
      { ok: true, emailSent, accessAssigned, user: createData },
      { status: 201 }
    )
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}