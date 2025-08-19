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

export async function updateUserAccess(
  userId: string,
  accessInt: number,
  session: any,
  base = process.env.NEXT_PUBLIC_API_URL
) {
  const token = await getTokenFromSession(session)
  const res = await fetch(`${base}/user/access`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      Guid_UserId: userId,
      Guid_CharityId: 'Admin Users',
      Int_UserAccess: accessInt,
    }),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('Failed to update user access')
  return res.json()
}

export async function editUserInfo(
  userId: string,
  payload: { VC_FirstName: string; VC_LastName: string; VC_Email: string },
  session: any,
  base = process.env.NEXT_PUBLIC_API_URL
) {
  const token = await getTokenFromSession(session)
  const res = await fetch(`${base}/user/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('Failed to edit user')
  return res.json()
}

export async function activateUser(userId: string, session: any, base = process.env.NEXT_PUBLIC_API_URL) {
  const token = await getTokenFromSession(session)
  const res = await fetch(`${base}/user/activate/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('Failed to activate user')
  return res.json()
}

export async function deactivateUser(userId: string, session: any, base = process.env.NEXT_PUBLIC_API_URL) {
  const token = await getTokenFromSession(session)
  const res = await fetch(`${base}/user/deactivate/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('Failed to deactivate user')
  return res.json()
}