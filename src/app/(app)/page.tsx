import { Stat } from '@/app/stat'
import { Avatar } from '@/components/avatar'
import { Heading, Subheading } from '@/components/heading'
import { Select } from '@/components/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/table'
import { getRecentOrders } from '@/data'

import { Button } from '@/components/button'
import { PlusIcon } from '@heroicons/react/16/solid'

export default async function Home() {
  let orders = await getRecentOrders()

  return (
    <>
      <div className="mt-8 flex items-end justify-between">
        <Heading>
          Good afternoon, Erica
        </Heading>
          <div>
            <Button color="fuchsia" href="/raffles/create-raffle" className="flex items-center">
              <PlusIcon className="mr-2" />
              CREATE RAFFLE
            </Button>
          </div>
      </div>
      <div className="mt-8 flex items-end justify-between">
        <Subheading>Overview</Subheading>
        <div>
          <Select name="period">
            <option value="last_week">Last week</option>
            <option value="last_two">Last two weeks</option>
            <option value="last_month">Last month</option>
            <option value="last_quarter">Last quarter</option>
          </Select>
        </div>
      </div>
      <div className="mt-4 grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
        <Stat title="Amount Raised" value="$2.6M" />
        <Stat title="Tickets Sold" value="455" />
        <Stat title="Raffles Completed" value="5,888" />
        <Stat title="Transactions Completed" value="823,067" />
      </div>
      <div className="mt-14 grid grid-cols-1 lg:grid-cols-2 gap-8">
  {/* Table 1: Recent Orders */}
  <div>
    <Subheading>Top Charities by number of Raffles</Subheading>
    <Table className="mt-4 [--gutter:--spacing(6)] lg:[--gutter:--spacing(10)]">
      <TableHead>
        <TableRow>
          <TableHeader>Charity</TableHeader>
          <TableHeader className="text-right">Raffles Conducted</TableHeader>
        </TableRow>
      </TableHead>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id} href={order.url} title={`Order #${order.id}`}>
            <TableCell>
              <div className="flex items-center gap-2">
                <Avatar src={order.event.thumbUrl} className="size-6" />
                <span>{order.event.name}</span>
              </div>
            </TableCell>
            <TableCell className="text-right">{order.amount.usd}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>

  {/* Table 2: Recent Raffle Purchases */}
  <div>
    <Subheading>Top Charities by Amount Raised</Subheading>
    <Table className="mt-4 [--gutter:--spacing(6)] lg:[--gutter:--spacing(10)]">
      <TableHead>
        <TableRow>
          <TableHeader>Charity</TableHeader>
          <TableHeader className="text-right">Amount Raised</TableHeader>
        </TableRow>
      </TableHead>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id} href={order.url} title={`Order #${order.id}`}>
            <TableCell>
              <div className="flex items-center gap-2">
                <Avatar src={order.event.thumbUrl} className="size-6" />
                <span>{order.event.name}</span>
              </div>
            </TableCell>
            <TableCell className="text-right">US{order.amount.usd}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
</div>
    </>
  )
}
