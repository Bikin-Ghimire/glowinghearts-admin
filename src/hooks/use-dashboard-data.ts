// hooks/use-dashboard-data.ts
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { getTokenFromSession } from './use-session-token'
import { format } from 'date-fns'

function getDateRange() {
  const to = new Date()
  const from = new Date(to)
  from.setDate(from.getDate() - 7)

  const formatDate = (d: Date) => format(d, 'yyyy-MM-dd HH:mm:ss')

  return {
    Dt_From: formatDate(from),
    Dt_To: formatDate(to),
  }
}

export function useDashboardData(period: string) {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<any>(null)
  const [topRaffle, setTopRaffle] = useState<any[]>([])
  const [topSales, setTopSales] = useState<any[]>([])

  function getDateRange(period: string) {
    const now = new Date()
    const from = new Date(now)

    switch (period) {
      case 'last_two':
        from.setDate(from.getDate() - 14)
        break
      case 'last_month':
        from.setMonth(from.getMonth() - 1)
        break
      case 'last_quarter':
        from.setMonth(from.getMonth() - 3)
        break
      case 'last_year':
        from.setFullYear(from.getFullYear() - 1)
        break
      case 'all_time':
        from.setFullYear(2000)
        break
      default:
        from.setDate(from.getDate() - 7)
    }

    const formatDate = (d: Date) => format(d, 'yyyy-MM-dd HH:mm:ss')
    return {
      Dt_From: formatDate(from),
      Dt_To: formatDate(now),
    }
  }

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const token = await getTokenFromSession(session)
      if (!token) return

      const { Dt_From, Dt_To } = getDateRange(period)
      const limit = 5

      const [summaryRes, topRaffleRes, topSalesRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/Report/Summary`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ Dt_From, Dt_To }),
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/Report/TopRaffle`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ Dt_From, Dt_To, Int_Limit: limit }),
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/Report/TopSales`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ Dt_From, Dt_To, Int_Limit: limit }),
        }),
      ])

      const summaryData = await summaryRes.json()
      const topRaffleData = await topRaffleRes.json()
      const topSalesData = await topSalesRes.json()

      if (summaryData.err_Code === 0) setSummary(summaryData)
      if (topRaffleData.err_Code === 0) setTopRaffle(topRaffleData.obj_Ranking)
      if (topSalesData.err_Code === 0) setTopSales(topSalesData.obj_Ranking)

      setLoading(false)
    }

    if (session) fetchData()
  }, [session, period])

  return { loading, summary, topRaffle, topSales }
}