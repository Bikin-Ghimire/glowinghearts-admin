export async function createJWT(email: string, password: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Account/CreateToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ VC_Email: email, VC_Pwd: password }),
  })

  const data = await res.json()
  return data.token
}