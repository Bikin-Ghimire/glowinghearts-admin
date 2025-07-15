import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const { pathname } = req.nextUrl

  const res = NextResponse.next()

  // ✅ Sync rememberMe cookie
  const rememberMeFromClient = req.cookies.get('rememberMeForward')?.value
  if (rememberMeFromClient !== undefined) {
    res.cookies.set('rememberMe', rememberMeFromClient, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })
    res.cookies.delete('rememberMeForward')
  }

  const isAuthPage = pathname.startsWith('/login')

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!api|_next|static|favicon.ico|login).*)', '/login'],
}