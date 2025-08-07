// hooks/useCreateRaffle.ts
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { getTokenFromSession } from './use-session-token'

export function useCreateRaffle({
  charityId,
  licenseNo,
  raffleName,
  raffleLocation,
  salesStartDate,
  salesEndDate,
  raffleDescription,
  raffleRules,
  bannerLink,
  prizes,
  bundles,
}: {
  charityId: string
  licenseNo: string
  raffleName: string
  raffleLocation: string
  salesStartDate: string
  salesEndDate: string
  raffleDescription: string
  raffleRules: string
  bannerLink: string
  prizes: any[]
  bundles: any[]
}) {
  const { data: session } = useSession()
  const router = useRouter()

  const formatPrizesForAPI = () => {
    const sorted = [...prizes].sort((a, b) => new Date(a.drawDate).getTime() - new Date(b.drawDate).getTime())
    return sorted.map((p, i) => ({
      Int_Place: i + 1,
      Int_Prize_Type: p.type,
      Int_AutomatedDraw: 1,
      VC_Description: p.name,
      Int_PrizeValuePercent: p.isPercentage ? 1 : 0,
      Dec_Value: parseFloat(p.amount),
      Dt_Draw: p.drawDate,
      Guid_TicketId: null,
    }))
  }

  const handleCreate = async () => {
    if (!charityId) return alert("No charity ID provided")

    // Get JWT
    // const jwtRes = await fetch('/api/create-jwt', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     VC_Email: session?.user?.email,
    //     VC_Pwd: session?.user?.password,
    //   }),
    // })
    // const { token } = await jwtRes.json()
    const token = await getTokenFromSession(session)

    const body = {
      VC_LicenseNumb: licenseNo,
      VC_RaffleName: raffleName,
      VC_RaffleLocation: raffleLocation,
      Dt_SaleOpen: salesStartDate,
      Dt_SaleClose: salesEndDate,
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Raffle/${charityId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json()
      return alert(`Raffle Error: ${error.message || response.statusText}`)
    }

    const result = await response.json()
    const Guid_DrawId = result.Guid_RaffleId
    if (!Guid_DrawId) return alert('Raffle created, but no ID returned.')

    // Upload Banner
    const bannerRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Banner/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        Guid_Id: Guid_DrawId,
        Int_BannerType: 50,
        VC_BannerLocation: bannerLink,
      }),
    })
    if (!bannerRes.ok) return alert(`Banner Error: ${await bannerRes.text()}`)

    // Upload Description
    const descriptionRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Raffle/Details/${Guid_DrawId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        Txt_GameDetails: raffleDescription,
      }),
    })
    if (!descriptionRes.ok) return alert(`Description Error: ${await descriptionRes.text()}`)

    // Upload Rules
    const rulesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Raffle/Rules/${Guid_DrawId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        Txt_GameRules: raffleRules,
      }),
    })
    if (!rulesRes.ok) return alert(`Rules Error: ${await rulesRes.text()}`)

    // Upload Prizes
    const prizesPayload = formatPrizesForAPI()
    for (const prize of prizesPayload) {
      const prizeRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Prize/${Guid_DrawId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(prize),
      })
      if (!prizeRes.ok) return alert(`Prize Error: ${await prizeRes.text()}`)
    }

    // Upload Bundles
    for (const bundle of bundles) {
      const buyInRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/BuyIn/${Guid_DrawId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          Int_NumbTicket: parseInt(bundle.numberOfTickets),
          Dec_Price: parseFloat(bundle.price),
          VC_Description: bundle.description,
        }),
      })
      if (!buyInRes.ok) return alert(`Buy-In Error: ${await buyInRes.text()}`)
    }

    alert('✅ Raffle created successfully!')
    router.push(`/raffles/${Guid_DrawId}`)
  }

  return { handleCreate }
}