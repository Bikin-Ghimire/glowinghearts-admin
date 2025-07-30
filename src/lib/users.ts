import { getTokenFromSession } from '@/hooks/use-session-token'

export async function getUsers(session: any) {
  const token = await getTokenFromSession(session)
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/list`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const data = await res.json()
  return Array.isArray(data.obj_Users) ? data.obj_Users : []
}