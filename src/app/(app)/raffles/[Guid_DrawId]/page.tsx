import { Stat } from '@/app/stat'
import { Badge } from '@/components/badge'
import { Button } from '@/components/button'
import { Heading, Subheading } from '@/components/heading'
import { Link } from '@/components/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/table'
import { getEvent, getEventOrders } from '@/data'
import { ChevronLeftIcon } from '@heroicons/react/16/solid'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

type Params = { params: { Guid_DrawId: string }}

// Optional: pre-generate raffle pages
// export async function generateStaticParams() {
//   const res = await fetch(
//     `${process.env.NEXT_PUBLIC_API_URL}/Raffles`,
//     { cache: 'no-store' }
//   )
//   const { obj_Raffles } = await res.json()
//   return obj_Raffles.map((r: any) => ({ Guid_DrawId: String(r.Guid_DrawId) }))
// }

export default async function RafflePage({ params: {Guid_DrawId} }: Params) {
  // 1. Fetch the raffle by ID
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/Raffle/${Guid_DrawId}`,
    { cache: 'no-store' }
  )
  if (!res.ok) return notFound()
  const { obj_Raffles } = await res.json()
  const raffle = Array.isArray(obj_Raffles) ? obj_Raffles[0] : null
  if (!raffle) return notFound()
  
  const statusMap: Record<number, { label: string; color: 'lime' | 'red' | 'zinc' }> = {
    1: { label: 'Inactive',   color: 'red' },
    2: { label: 'Active', color: 'lime'  },
    3: { label: 'New',      color: 'zinc' },
  }
  const { label, color } = statusMap[raffle.Int_DrawStatus] ?? {
    label: 'Unknown',
    color: 'zinc',
  }

  return (
    <>
      <div className="max-lg:hidden">
        <Link href="/events" className="inline-flex items-center gap-2 text-sm/6 text-zinc-500 dark:text-zinc-400">
          <ChevronLeftIcon className="size-4 fill-zinc-400 dark:fill-zinc-500" />
          All Raffles
        </Link>
      </div>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="w-32 shrink-0">
            <img className="aspect-3/2 rounded-lg shadow-sm" src='https://i.ibb.co/ycznPrB5/ribfest.png' alt="" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Heading>{raffle.VC_RaffleName}</Heading>
              <Badge color={color}>{label}</Badge>
            </div>
            <div className="mt-2 text-sm/6 text-zinc-500">
              {raffle.Dt_SalesOpen} <span aria-hidden="true">·</span> {raffle.VC_RaffleLocation}
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <Button outline>Edit</Button>
          <Button>View</Button>
        </div>
      </div>
      <div className="mt-8 grid gap-8 sm:grid-cols-3">
        <Stat title="Total amount raised" value='2954' change='6' />
        <Stat
          title="Tickets sold"
          value='754'
          change='7'
        />
        <Stat title="Purchases made" value='200' change='2' />
      </div>
      {/* <Subheading className="mt-12">Recent orders</Subheading>
      <Table className="mt-4 [--gutter:--spacing(6)] lg:[--gutter:--spacing(10)]">
        <TableHead>
          <TableRow>
            <TableHeader>Order number</TableHeader>
            <TableHeader>Purchase date</TableHeader>
            <TableHeader>Customer</TableHeader>
            <TableHeader className="text-right">Amount</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id} href={order.url} title={`Order #${order.id}`}>
              <TableCell>{order.id}</TableCell>
              <TableCell className="text-zinc-500">{order.date}</TableCell>
              <TableCell>{order.customer.name}</TableCell>
              <TableCell className="text-right">US{order.amount.usd}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table> */}
    </>
  )
}
