import jwt from 'jsonwebtoken'
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { cookies } from 'next/headers'

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
  const apiBase = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL
  if (!apiBase) throw new Error('API base URL not configured')
  const bearer = buildApiBearerFromCreds(email, password)

  const res = await fetch(`process.env.NEXT_PUBLIC_API_URL/user/Check`, {
    method: 'GET', // ⬅ change to 'POST' if your API needs it
    headers: { Authorization: bearer },
    cache: 'no-store',
  })

  let data: any = null
  try {
    data = await res.json()
  } catch {}
  if (!res.ok) {
    throw new Error((data && (data.message || data.error)) || `Check failed (${res.status})`)
  }
  return data
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const { email, password } = (credentials ?? {}) as { email?: string; password?: string }
        if (!email || !password) return null

        const rememberMe = cookies().get('rememberMe')?.value === 'true'

        const data = await callUserCheck(email, password).catch(() => null)
        if (!data || Number(data.err_Code) !== 0) return null

        // Ensure we have stable identifiers
        const guid = String(data.Guid_UserId || email)

        return {
          id: guid,
          name: guid,
          email,
          password, // keep so your getTokenFromSession() keeps working
          rememberMe,
          charityAccess: data.obj_CharityAccess ?? [],
        }
      },
    }),
  ],

  pages: {
    signIn: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24, // fallback 1 day
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.email = user.email as string
        token.password = (user as any).password
        token.rememberMe = (user as any).rememberMe
        token.charityAccess = (user as any).charityAccess

        // Store a custom expiration based on rememberMe
        token.exp = Math.floor(
          Date.now() / 1000 + (user.rememberMe ? 60 * 60 * 24 * 7 : 60 * 60 * 2) // 7 days or 2 hours
        )
      }
      return token
    },

    async session({ session, token }) {
      session.user.id = String(token.id)
      session.user.email = String(token.email)
      session.user.rememberMe = Boolean(token.rememberMe)
      session.user.password = token.password as string | undefined
      session.user.charityAccess = (token.charityAccess as any[]) || []

      const exp = typeof token.exp === 'number' ? token.exp : 0
      session.expires = new Date(exp * 1000).toISOString()

      return session
    },
  },

  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
}