export async function getTokenFromSession(session: any): Promise<string | null> {
  if (!session?.user?.email || !session?.user?.password) return null

  const res = await fetch('/api/create-jwt', {
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