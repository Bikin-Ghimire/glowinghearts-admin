// lib/auth-options.ts
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { cookies } from 'next/headers'

const ABSOLUTE_SESSION_SECONDS = 12 * 60 * 60 // 12h hard cap
const TRUSTED_DEVICE_DAYS = 30
const isProd = process.env.NODE_ENV === 'production'

/** ---------------- tiny timing-safe compare helpers ---------------- */
function tsecEqual(a: string, b: string) {
  const aBuf = Buffer.from(a, 'utf8')
  const bBuf = Buffer.from(b, 'utf8')
  if (aBuf.length !== bBuf.length) return false
  return crypto.timingSafeEqual(
    new Uint8Array(aBuf.buffer, aBuf.byteOffset, aBuf.byteLength),
    new Uint8Array(bBuf.buffer, bBuf.byteOffset, bBuf.byteLength)
  )
}

// === Replace your isMfaBypassEmail() with this ===
const MFA_BYPASS_SET = new Set(
  (process.env.MFA_BYPASS_EMAILS ?? '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)
)

function isMfaBypassEmail(email?: string) {
  if (!email) return false
  return MFA_BYPASS_SET.has(email.toLowerCase())
}

/** ---------------- Password check ---------------- */
function buildApiBearerFromCreds(email: string, password: string) {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET env not set')
  const token = jwt.sign({ VC_Email: email, VC_Pwd: password }, secret, {
    algorithm: 'HS256',
    expiresIn: '10m',
  })
  return `Bearer ${token}`
}

async function callUserCheck(email: string, password: string) {
  const bearer = buildApiBearerFromCreds(email, password)
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/Check`, {
    method: 'GET',
    headers: { Authorization: bearer },
    cache: 'no-store',
  })
  let data: any = null
  try {
    data = await res.json()
  } catch {}
  if (!res.ok) throw new Error('ERR_CHECK_FAILED')
  return data
}

/** ---------------- OTP VERIFY (Bearer + JSON {VC_Key}) ---------------- */
async function verify2faCode(email: string, password: string, codeRaw: string) {
  const code = String(codeRaw || '').trim()
  if (!code) throw new Error('ERR_OTP_REQUIRED')

  const base = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '')
  const url = `${base}/user/auth1/`
  const bearer = buildApiBearerFromCreds(email, password) // already "Bearer <jwt>"

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: bearer, // <-- important: NOT `Bearer ${bearer}`
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ VC_Key: code }),
    cache: 'no-store',
  })

  let body: any = null
  try {
    body = await res.json()
  } catch {}

  if (!res.ok || !body || Number(body.err_Code) !== 0) {
    throw new Error('ERR_OTP_INVALID')
  }
}

/** ---------------- Trusted device helpers ---------------- */
function perEmailTrustCookie(email: string) {
  const b64 = Buffer.from(email).toString('base64').replace(/=+$/, '')
  return `__Host_trust_${b64}`
}
function verifySigned(token: string) {
  try {
    const secret = process.env.NEXTAUTH_SECRET || 'fallback'
    jwt.verify(token, secret)
    return true
  } catch {
    return false
  }
}

/** ==================== NextAuth Options ==================== */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        twoFactorCode: { label: '2FA Code', type: 'text' },
        trustDevice: { label: 'Trust Device', type: 'text' },
      },
      async authorize(credentials) {
        const { email, password, twoFactorCode } = (credentials ?? {}) as {
          email?: string
          password?: string
          twoFactorCode?: string
        }

        if (!email || !password) return null

        const now = Math.floor(Date.now() / 1000)

        // Password check
        let data: any
        try {
          data = await callUserCheck(email, password)
        } catch {
          // Explicit error helps client render a specific message
          throw new Error('ERR_CHECK_FAILED')
        }
        if (!data || Number(data.err_Code) !== 0) {
          throw new Error('ERR_CHECK_FAILED')
        }

        // 2) Decide if we can skip MFA
        const trustCookieName = perEmailTrustCookie(email)
        const trustedCookie = cookies().get(trustCookieName)?.value
        const isTrustedDevice = !!trustedCookie && verifySigned(trustedCookie)
        const skipMfa = isTrustedDevice || isMfaBypassEmail(email) // <— admin email bypass here

        // 3) If NOT trusted, require + verify OTP
        if (!skipMfa) {
          try {
            await verify2faCode(email, password, twoFactorCode ?? '')
          } catch {
            throw new Error('ERR_OTP_INVALID')
          }
        }

        const rememberMe = cookies().get('rememberMe')?.value === 'true'
        const guid = String(data.Guid_UserId || email)

        return {
          id: guid,
          name: guid,
          email,
          password,
          rememberMe,
          charityAccess: data.obj_CharityAccess ?? [],
          twoFactorOk: true,
          sessionStart: now,
        }
      },
    }),
  ],

  pages: { signIn: '/login' },

  session: {
    strategy: 'jwt',
    maxAge: ABSOLUTE_SESSION_SECONDS,
    updateAge: 5 * 60,
  },

  // Env-aware cookie security so localhost works and prod is strict
  useSecureCookies: isProd,
  cookies: isProd
    ? {
        sessionToken: {
          name: '__Secure-next-auth.session-token',
          options: { httpOnly: true, sameSite: 'lax', path: '/', secure: true },
        },
        callbackUrl: {
          name: '__Secure-next-auth.callback-url',
          options: { httpOnly: true, sameSite: 'lax', path: '/', secure: true },
        },
        csrfToken: {
          name: '__Host-next-auth.csrf-token',
          options: { httpOnly: true, sameSite: 'lax', path: '/', secure: true },
        },
      }
    : {
        sessionToken: {
          name: 'next-auth.session-token',
          options: { httpOnly: true, sameSite: 'lax', path: '/', secure: false },
        },
        callbackUrl: {
          name: 'next-auth.callback-url',
          options: { httpOnly: true, sameSite: 'lax', path: '/', secure: false },
        },
        csrfToken: {
          name: 'next-auth.csrf-token',
          options: { httpOnly: true, sameSite: 'lax', path: '/', secure: false },
        },
      },

  callbacks: {
    async jwt({ token, user }) {
      const now = Math.floor(Date.now() / 1000)
      if (user) {
        token.id = user.id as string
        token.email = user.email as string
        token.password = (user as any).password
        token.rememberMe = (user as any).rememberMe
        token.charityAccess = (user as any).charityAccess
        token.twoFactorOk = (user as any).twoFactorOk === true
        token.sessionStart = (user as any).sessionStart || now
        token.exp = Number(token.sessionStart) + ABSOLUTE_SESSION_SECONDS
      } else {
        const sessionStart = Number(token.sessionStart || now)
        const absExp = sessionStart + ABSOLUTE_SESSION_SECONDS
        token.exp = Math.min(absExp, now + ABSOLUTE_SESSION_SECONDS)
      }
      return token
    },

    async session({ session, token }) {
      if (!token.twoFactorOk) {
        session.user = { id: '', email: '' } as any
        session.expires = new Date(0).toISOString()
        return session
      }
      session.user.id = String(token.id)
      session.user.email = String(token.email)
      session.user.rememberMe = Boolean(token.rememberMe)
      session.user.password = token.password as string | undefined
      session.user.charityAccess = (token.charityAccess as any[]) || []
      session.expires = new Date((token.exp as number) * 1000).toISOString()
      return session
    },
  },
}
