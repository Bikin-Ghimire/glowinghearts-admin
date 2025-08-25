export async function getTokenFromSession(session: any): Promise<string | null> {
  if (!session?.user?.email || !session?.user?.password) return null

  const isServer = typeof window === 'undefined'
  const strip = (s: string) => s.replace(/\/+$/, '')
  const base =
    isServer
      ? (process.env.NEXTAUTH_URL && strip(process.env.NEXTAUTH_URL)) ||
        (process.env.FRONTEND_URL && strip(process.env.FRONTEND_URL)) ||
        (process.env.VERCEL_URL && `https://${strip(process.env.VERCEL_URL)}`) ||
        null
      : ''

  const url = isServer && base ? `${base}/api/create-jwt` : '/api/create-jwt'

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      VC_Email: session.user.email,
      VC_Pwd: session.user.password,
    }),
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`create-jwt failed: ${res.status} ${text.slice(0, 300)}`)
  }

  const { token } = await res.json()
  return token ?? null
}