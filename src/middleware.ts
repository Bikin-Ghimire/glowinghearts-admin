// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

const PUBLIC_PATHS = [
  '/login',
  '/forgot-password',
  // add more public routes here if needed
]

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(p => pathname.startsWith(p))
}

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const { pathname } = req.nextUrl

  // Decide the base response first (next or redirects)
  let response: NextResponse

  if (token && isPublicPath(pathname)) {
    // Logged-in user visiting a public auth page → send to app
    response = NextResponse.redirect(new URL('/', req.url))
  } else if (!token && !isPublicPath(pathname)) {
    // Not logged in and path is protected → send to login
    response = NextResponse.redirect(new URL('/login', req.url))
  } else {
    // Allowed to proceed
    response = NextResponse.next()
  }

  // ✅ Sync rememberMe cookie onto httpOnly cookie on whichever response we’re returning
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
  // Let code handle which routes are public; run middleware for most pages
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}