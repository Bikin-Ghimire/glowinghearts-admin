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

export async function getUserById(Guid_UserId: string, session: any) {
  const token = await getTokenFromSession(session)
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/${Guid_UserId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch user: ${res.statusText}`)
  }

  const data = await res.json()
  return data.obj_Users || null
}

export async function getUserAccess(Guid_UserId: string, session: any) {
  const token = await getTokenFromSession(session)
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/access/${Guid_UserId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch user access: ${res.statusText}`)
  }

  const data = await res.json()
  return data.obj_Access || []
}