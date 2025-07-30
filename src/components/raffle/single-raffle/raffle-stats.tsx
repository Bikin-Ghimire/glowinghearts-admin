// components/RaffleStats.tsx
'use client'

import { Stat } from '@/app/stat'

type Props = {
  raffle: any
}

export function RaffleStats({ raffle }: Props) {
  return (
    <div className="mt-8 grid gap-8 sm:grid-cols-3">
      <Stat title="Total Amount Raised" value={`$${(raffle.Dec_MoneyRaised ?? 0).toFixed(2)}`} />
      <Stat title="Tickets Sold" value={`${raffle.Int_TicketSold || 0}`} />
      <Stat
        title="Avg Price Per Ticket"
        value={`$${((raffle.Dec_MoneyRaised ?? 0) / (raffle.Int_TicketSold || 1)).toFixed(2)}`}
      />
    </div>
  )
}