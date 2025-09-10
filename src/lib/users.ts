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
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/get/${Guid_UserId}`, {
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
  const res = await fetch(`${base}/user/update/${userId}`, {
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


export type UserChangeItem = {
  VC_Action: 'CREATE' | 'UPDATE' | string
  VC_FirstName?: string
  VC_LastName?: string
  VC_Email?: string
  Dt_CreateUpdate: string // ISO
  VC_Admin_FirstName?: string
  VC_Admin_LastName?: string
  Int_UserStatus?: number | null
}

export async function getUserChanges(
  Guid_UserId: string,
  opts: { from: string; to: string },
  session: any,
  base = process.env.NEXT_PUBLIC_API_URL
) {
  const token = await getTokenFromSession(session)
  const res = await fetch(`${base}/Report/UserChanges/${Guid_UserId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ Dt_From: opts.from, Dt_To: opts.to }),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Failed to fetch user changes: ${res.status}`)
  const data = await res.json()
  return Array.isArray(data.obj_Activity) ? (data.obj_Activity as UserChangeItem[]) : []
}

export type UserActivityItem = {
  VC_API_Call: string
  Dt_CreateUpdate: string // ISO
}

function toSqlTs(d: Date) {
  // "YYYY-MM-DD HH:mm:ss" in local time (adjust if your API expects server TZ)
  const pad = (n: number) => String(n).padStart(2, '0')
  const yyyy = d.getFullYear()
  const MM = pad(d.getMonth() + 1)
  const dd = pad(d.getDate())
  const hh = pad(d.getHours())
  const mm = pad(d.getMinutes())
  const ss = pad(d.getSeconds())
  return `${yyyy}-${MM}-${dd} ${hh}:${mm}:${ss}`
}

export function last25HoursRange() {
  const to = new Date()
  const from = new Date(to.getTime() - 25 * 60 * 60 * 1000)
  return { from: toSqlTs(from), to: toSqlTs(to) }
}

export async function getUserActivity(
  Guid_UserId: string,
  opts: { from: string; to: string },
  session: any,
  base = process.env.NEXT_PUBLIC_API_URL
) {
  const token = await getTokenFromSession(session)
  const res = await fetch(`${base}/Report/UserLog/${Guid_UserId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ Dt_From: opts.from, Dt_To: opts.to }),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Failed to fetch user activity: ${res.status}`)
  const data = await res.json()
  return Array.isArray(data.obj_Activity) ? (data.obj_Activity as UserActivityItem[]) : []
}