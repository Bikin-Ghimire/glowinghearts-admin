import 'next-auth'

declare module 'next-auth' {
  interface User {
    rememberMe?: boolean
  }

  interface Session {
    user: {
      id: string
      email: string
      rememberMe?: boolean
    }
    expires: string
  }

  interface JWT {
    id: string
    email: string
    rememberMe?: boolean
    exp?: number
  }
}