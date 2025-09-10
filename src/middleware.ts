// middleware.ts
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const PUBLIC_PAGES = new Set<string>(['/login', '/forgot-password'])
const PUBLIC_PREFIXES = ['/users/reset-password']

function isPublicPath(pathname: string) {
  if (PUBLIC_PAGES.has(pathname)) return true
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  let response: NextResponse

  // Public pages
  if (isPublicPath(pathname)) {
    if (token && (pathname === '/login' || pathname === '/forgot-password')) {
      response = NextResponse.redirect(new URL('/', req.url))
    } else {
      response = NextResponse.next()
    }
  } else if (!token) {
    // Protected route: need auth
    response = NextResponse.redirect(new URL('/login', req.url))
  } else {
    // ----- Idle timeout enforcement -----
    const IDLE_LIMIT_SEC = 15 * 60
    const lastActiveStr = req.cookies.get('__Host-last-active')?.value
    const nowSec = Math.floor(Date.now() / 1000)
    const lastActive = lastActiveStr ? Number(lastActiveStr) : nowSec

    if (nowSec - lastActive > IDLE_LIMIT_SEC) {
      // Idle too long → force re-auth
      response = NextResponse.redirect(new URL('/login', req.url))
      response.cookies.delete('__Host-last-active')
    } else {
      response = NextResponse.next()
      // refresh last-active on each request

      const isProd = process.env.NODE_ENV === 'production'
      response.cookies.set('__Host-last-active', String(nowSec), {
        httpOnly: true,
        secure: isProd, // <— only secure in prod
        sameSite: 'lax',
        path: '/',
      })
    }
  }

  // Bridge rememberMeForward -> rememberMe (your existing pattern)
  const rememberMeFromClient = req.cookies.get('rememberMeForward')?.value
  if (rememberMeFromClient !== undefined) {
    response.cookies.set('rememberMe', rememberMeFromClient, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // keep pref for 30d
    })
    response.cookies.delete('rememberMeForward')
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
