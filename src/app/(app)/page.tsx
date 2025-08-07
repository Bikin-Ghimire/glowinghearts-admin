'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useDashboardData } from '@/hooks/use-dashboard-data'
import { Stat } from '@/app/stat'
import { Avatar } from '@/components/avatar'
import { Heading, Subheading } from '@/components/heading'
import { Select } from '@/components/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/table'
import { Button } from '@/components/button'
import { PlusIcon } from '@heroicons/react/16/solid'

export default function Home() {
  const { data: session } = useSession()
  const user = session?.user

  const [period, setPeriod] = useState('last_week')
  const { loading, summary, topRaffle, topSales } = useDashboardData(period)

  return (
    <>
      <div className="mt-8 flex items-end justify-between">
        <Heading>Good afternoon, {user?.name || 'User'}</Heading>
        <div>
          <Button color="fuchsia" href="/charities" className="flex items-center">
            <PlusIcon className="mr-2" />
            GET STARTED
          </Button>
        </div>
      </div>

      <div className="mt-8 flex items-end justify-between">
        <Subheading>Overview</Subheading>
        <div>
          <Select name="period" value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="last_week">Last week</option>
            <option value="last_two">Last two weeks</option>
            <option value="last_month">Last month</option>
            <option value="last_quarter">Last quarter</option>
            <option value="last_year">Last year</option>
            <option value="all_time">All time</option>
          </Select>
        </div>
      </div>

      <div className="mt-4 grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
        <Stat title="Amount Raised" value={`$${summary?.Dec_MoneyRaised ?? '0'}`} />
        <Stat title="Tickets Sold" value={summary?.Int_NumbTicket ?? '0'} />
        <Stat title="Raffles Completed" value={summary?.Int_RafflesCompleted ?? 'None'} />
        <Stat title="Transactions Completed" value={summary?.Int_PurchaseTrans ?? 'None'} />
      </div>

      <div className="mt-14 grid grid-cols-1 lg:grid-cols-2 gap-8">
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
              {topRaffle.map((charity) => (
                <TableRow key={charity.Guid_CharityId}>
                  <TableCell>{charity.VC_CharityDesc}</TableCell>
                  <TableCell className="text-right">{charity.Int_RaffleCount ?? '0'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

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
              {topSales.map((charity) => (
                <TableRow key={charity.Guid_CharityId}>
                  <TableCell>{charity.VC_CharityDesc}</TableCell>
                  <TableCell className="text-right">${charity.Dec_MoneyRaised}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  )
}