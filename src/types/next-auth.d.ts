import 'next-auth'

declare module 'next-auth' {
  interface User {
    rememberMe?: boolean
    password?: string
    charityAccess?: any[]
  }

  interface Session {
    user: {
      id: string
      email: string
      rememberMe?: boolean
      password?: string
      charityAccess?: any[]
    }
    expires: string
  }

  interface JWT {
    id: string
    email: string
    rememberMe?: boolean
    password?: string
    charityAccess?: any[]
    exp?: number
  }
}