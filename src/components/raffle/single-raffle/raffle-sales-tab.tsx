// components/Raffle/RaffleSalesTab.tsx
'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/table'
import { format } from 'date-fns'

type Props = {
  purchases: any[]
  raffleId: string
}

export function RaffleSalesTab({ purchases, raffleId }: Props) {
  return (
    <Table className="mt-4 [--gutter:--spacing(6)] lg:[--gutter:--spacing(10)]">
      <TableHead>
        <TableRow>
          <TableHeader>Purchase ID</TableHeader>
          <TableHeader>Amount Paid</TableHeader>
          <TableHeader>Tickets Purchased</TableHeader>
          <TableHeader>Purchase Date</TableHeader>
        </TableRow>
      </TableHead>
      <TableBody>
        {purchases.map((purchase) => (
          <TableRow key={purchase.Guid_PurchaseId}>
            <TableCell>{purchase.Guid_PurchaseId}</TableCell>
            <TableCell>${purchase.Dec_TotalPrice}</TableCell>
            <TableCell>{purchase.Int_TotalTickets}</TableCell>
            <TableCell>
              {purchase.Dt_Purchased && purchase.Dt_Purchased !== '0000-00-00 00:00:00'
                ? format(new Date(purchase.Dt_Purchased), 'MMMM d, yyyy')
                : 'TBD'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}