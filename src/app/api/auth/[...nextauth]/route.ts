// src/app/api/auth/[...nextauth]/route.ts

import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { cookies } from 'next/headers'
import type { NextAuthOptions } from 'next-auth'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const { email, password } = credentials as { email: string; password: string }
        const rememberMe = cookies().get('rememberMe')?.value === 'true'

        if (email === 'TEMPADMIN' && password === 'gogogogo') {
          return { id: '1', name: 'Admin', email, rememberMe, password}
        }

        return null
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
        token.id = user.id
        token.email = user.email
        token.rememberMe = user.rememberMe
        token.password = user.password  // Must be passed from `authorize()`

        // Store a custom expiration based on rememberMe
        token.exp = Math.floor(
          Date.now() / 1000 +
            (user.rememberMe ? 60 * 60 * 24 * 7 : 60 * 60 * 2) // 7 days or 2 hours
        )
      }
      return token
    },

    async session({ session, token }) {
      session.user.id = String(token.id)
      session.user.email = String(token.email)
      session.user.rememberMe = Boolean(token.rememberMe)
      session.user.password = token.password  // Must be passed from `authorize()`

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

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }