export async function getTokenFromSession(session: any): Promise<string | null> {
  if (!session?.user?.email || !session?.user?.password) return null

  const isServer = typeof window === 'undefined'
  const url = isServer
    ? `${process.env.NEXTAUTH_URL}/api/create-jwt`
    : '/api/create-jwt'

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      VC_Email: session.user.email,
      VC_Pwd: session.user.password,
    }),
  })

  const { token } = await res.json()
  return token
}