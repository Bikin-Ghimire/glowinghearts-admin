import { getTokenFromSession } from '@/hooks/use-session-token'

export async function getCharities(session: any) {
  const token = await getTokenFromSession(session)
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Charities`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const data = await res.json()
  return Array.isArray(data.obj_Charities) ? data.obj_Charities : []
}

export async function updateCharityStatus({
  session,
  id,
  newStatus,
  updateFn, // this is now a refetch function
  apiFn,
}: {
  session: any
  id: string
  newStatus: number
  updateFn: () => void
  apiFn: (id: string, token: string) => Promise<any>
}) {
  const token = await getTokenFromSession(session)
  if (!token) {
    console.error('No token found in session.')
    alert('Failed to update charity: No session token found.')
    return
  }
  try {
    await apiFn(id, token)
    await updateFn()
  } catch (err) {
    console.error('Failed to update charity status:', err)
    alert('Failed to update charity on server.')
  }
}

export async function activateCharity(id: string, token: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Charities/Activate/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Activate failed: ${res.status} - ${errText}`)
  }

  return res.json()
}

export async function deactivateCharity(id: string, token: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Charities/DeActivate/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Deactivate failed: ${res.status} - ${errText}`)
  }

  return res.json()
}

export async function getCharityById(id: string, token: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Charities/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  })

  const { obj_Charities } = await res.json()
  return Array.isArray(obj_Charities) ? obj_Charities[0] : null
}

export async function getCharityRaffles(charityId: string, token: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Charity/Raffles/${charityId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  })

  const { obj_Raffles } = await res.json()
  return Array.isArray(obj_Raffles) ? obj_Raffles : []
}