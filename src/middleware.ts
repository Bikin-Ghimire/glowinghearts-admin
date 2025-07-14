// src/middleware.ts

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const { pathname } = req.nextUrl

  // Sync rememberMeForward cookie
  const rememberMeFromClient = req.cookies.get('rememberMeForward')?.value
  if (rememberMeFromClient) {
    const res = NextResponse.next()
    res.cookies.set('rememberMe', rememberMeFromClient, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })
    res.cookies.delete('rememberMeForward')
    return res
  }

  const isAuthPage = pathname.startsWith('/login')

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next|static|favicon.ico|login).*)'],
}