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

type Params = { params: { Guid_CharityId: string } }

// (Optional) statically generate one page per charity at build time
export async function generateStaticParams() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/Charities`,
    { cache: 'no-store' }
  )
  const { obj_Charities } = await res.json()
  return obj_Charities.map((c: any) => ({ Guid_CharityId: String(c.Guid_CharityId) }))
}

export default async function CharityPage({ params: {Guid_CharityId} }: Params) {
  // Try to fetch the single charity
  const charityRes = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/Charities/${Guid_CharityId}`,
    { cache: 'no-store' }
  )
  if (!charityRes.ok) return notFound()
  const { obj_Charities } = await charityRes.json()
  const charity = Array.isArray(obj_Charities) ? obj_Charities[0] : null
  if (!charity) return notFound()
  
  // Try to fetch the charity's raffles
  const raffleRes = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/Charity/Raffles/${Guid_CharityId}`,
    { cache: 'no-store' }
  )
  if (!raffleRes.ok) {
    // If the charity has no raffles or the call fails,
    // you can either show “No raffles” or 404. Here we show empty.
  }
  const { obj_Raffles } = await raffleRes.json()
  const raffles = Array.isArray(obj_Raffles) ? obj_Raffles : []
  if (!raffles) return notFound()

  const statusMap: Record<number, { label: string; color: 'lime' | 'red' | 'zinc' }> = {
    1: { label: 'Active',   color: 'lime' },
    2: { label: 'Deactive', color: 'red'  },
    3: { label: 'New',      color: 'zinc' },
  }
  const { label, color } = statusMap[charity.Int_CharityStatus] ?? {
    label: 'Unknown',
    color: 'zinc',
  }

  return (
    <>
      <div className="max-lg:hidden">
        <Link href="/charities" className="inline-flex items-center gap-2 text-sm/6 text-zinc-500 dark:text-zinc-400">
          <ChevronLeftIcon className="size-4 fill-zinc-400 dark:fill-zinc-500" />
          Charity List
        </Link>
      </div>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6">
          {/* <div className="w-32 shrink-0">
            <img className="aspect-3/2 rounded-lg shadow-sm" src={event.imgUrl} alt="" />
          </div> */}
          <div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Heading>{charity.VC_CharityDesc}</Heading>
              <Badge color={color}>{label}</Badge>
            </div>
            {/* <div className="mt-2 text-sm/6 text-zinc-500">
              {event.date} at {event.time} <span aria-hidden="true">·</span> {event.location}
            </div> */}
          </div>
        </div>
        <div className="flex gap-4">
          <Button outline>Edit</Button>
          <Button>View</Button>
        </div>
      </div>
      {/* <div className="mt-8 grid gap-8 sm:grid-cols-3">
        <Stat title="Total revenue" value={event.totalRevenue} change={event.totalRevenueChange} />
        <Stat
          title="Tickets sold"
          value={`${event.ticketsSold}/${event.ticketsAvailable}`}
          change={event.ticketsSoldChange}
        />
        <Stat title="Pageviews" value={event.pageViews} change={event.pageViewsChange} />
      </div> */}
      <Subheading className="mt-12">Recent raffles</Subheading>
      {raffles.length === 0 ? (
        <p className="text-zinc-500">No raffles found.</p>
      ) : (
      <Table className="mt-4 [--gutter:--spacing(6)] lg:[--gutter:--spacing(10)]">
        <TableHead>
          <TableRow>
            <TableHeader>Raffle Name</TableHeader>
            <TableHeader>Start Date</TableHeader>
            <TableHeader>End Date</TableHeader>
            <TableHeader className="text-right">Status</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {raffles.map((raffle) => (
            <TableRow key={raffle.Guid_DrawId} href={`/raffles/${raffle.Guid_DrawId}`} title={`Raffle #${raffle.Guid_DrawId}`}>
              <TableCell>{raffle.VC_RaffleName}</TableCell>
              <TableCell className="text-zinc-500">{raffle.Dt_SalesOpen}</TableCell>
              <TableCell>{raffle.Dt_SalesClose}</TableCell>
              <TableCell className="text-right">{raffle.Int_DrawStatus}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      )}
    </>
  )
}

// export async function generateMetadata({ params }: { params: { Guid_CharityID: string } }): Promise<Metadata> {
//   let event = await getEvent(params.Guid_CharityID)

//   return {
//     title: event?.name,
//   }
// }

// export default async function Event({ params }: { params: { Guid_CharityID: string } }) {
//   let event = await getEvent(params.Guid_CharityID)
//   let orders = await getEventOrders(params.Guid_CharityID)

//   if (!event) {
//     notFound()
//   }

//   return (
//     <>
//       <div className="max-lg:hidden">
//         <Link href="/events" className="inline-flex items-center gap-2 text-sm/6 text-zinc-500 dark:text-zinc-400">
//           <ChevronLeftIcon className="size-4 fill-zinc-400 dark:fill-zinc-500" />
//           Events
//         </Link>
//       </div>
//       <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
//         <div className="flex flex-wrap items-center gap-6">
//           <div className="w-32 shrink-0">
//             <img className="aspect-3/2 rounded-lg shadow-sm" src={event.imgUrl} alt="" />
//           </div>
//           <div>
//             <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
//               <Heading>{event.name}</Heading>
//               <Badge color={event.status === 'On Sale' ? 'lime' : 'zinc'}>{event.status}</Badge>
//             </div>
//             <div className="mt-2 text-sm/6 text-zinc-500">
//               {event.date} at {event.time} <span aria-hidden="true">·</span> {event.location}
//             </div>
//           </div>
//         </div>
//         <div className="flex gap-4">
//           <Button outline>Edit</Button>
//           <Button>View</Button>
//         </div>
//       </div>
//       <div className="mt-8 grid gap-8 sm:grid-cols-3">
//         <Stat title="Total revenue" value={event.totalRevenue} change={event.totalRevenueChange} />
//         <Stat
//           title="Tickets sold"
//           value={`${event.ticketsSold}/${event.ticketsAvailable}`}
//           change={event.ticketsSoldChange}
//         />
//         <Stat title="Pageviews" value={event.pageViews} change={event.pageViewsChange} />
//       </div>
//       <Subheading className="mt-12">Recent orders</Subheading>
//       <Table className="mt-4 [--gutter:--spacing(6)] lg:[--gutter:--spacing(10)]">
//         <TableHead>
//           <TableRow>
//             <TableHeader>Order number</TableHeader>
//             <TableHeader>Purchase date</TableHeader>
//             <TableHeader>Customer</TableHeader>
//             <TableHeader className="text-right">Amount</TableHeader>
//           </TableRow>
//         </TableHead>
//         <TableBody>
//           {orders.map((order) => (
//             <TableRow key={order.id} href={order.url} title={`Order #${order.id}`}>
//               <TableCell>{order.id}</TableCell>
//               <TableCell className="text-zinc-500">{order.date}</TableCell>
//               <TableCell>{order.customer.name}</TableCell>
//               <TableCell className="text-right">US{order.amount.usd}</TableCell>
//             </TableRow>
//           ))}
//         </TableBody>
//       </Table>
//     </>
//   )
// }
