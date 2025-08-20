// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

/**
 * Exact public pages (no params)
 */
const PUBLIC_PAGES = new Set<string>([
  '/login',
  '/forgot-password',
])

/**
 * Public URL prefixes (with dynamic segments after)
 * e.g., /users/reset-password/<key1>/<key2>
 */
const PUBLIC_PREFIXES = [
  '/users/reset-password',
]

function isPublicPath(pathname: string) {
  if (PUBLIC_PAGES.has(pathname)) return true
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))
}

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const { pathname } = req.nextUrl

  let response: NextResponse

  // If the path is public (including reset-password), always allow
  if (isPublicPath(pathname)) {
    // Optional: if logged in and visiting /login or /forgot-password, redirect to app
    if (token && (pathname === '/login' || pathname === '/forgot-password')) {
      response = NextResponse.redirect(new URL('/', req.url))
    } else {
      response = NextResponse.next()
    }
  } else if (!token) {
    // Protected route and not logged in → go to login
    response = NextResponse.redirect(new URL('/login', req.url))
  } else {
    response = NextResponse.next()
  }

  // Keep your rememberMe cookie sync
  const rememberMeFromClient = req.cookies.get('rememberMeForward')?.value
  if (rememberMeFromClient !== undefined) {
    response.cookies.set('rememberMe', rememberMeFromClient, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })
    response.cookies.delete('rememberMeForward')
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}