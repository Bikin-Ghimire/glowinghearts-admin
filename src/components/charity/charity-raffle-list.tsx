'use client'

import { Badge } from '@/components/badge'
import { Button } from '@/components/button'
import { Heading } from '@/components/heading'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/table'
import { raffleStatusMap } from '@/lib/utils'
import { PlusIcon } from '@heroicons/react/16/solid'
import { format } from 'date-fns'
import { useState } from 'react'

export function CharityRaffleList({ charity, raffles }: { charity: any; raffles: any[] }) {
  const [selectedStatuses, setSelectedStatuses] = useState<number[]>([])

  const toggleStatus = (status: number) => {
    setSelectedStatuses((prev) => (prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]))
  }

  const filteredRaffles = raffles.filter(
    (raffle) => selectedStatuses.length === 0 || selectedStatuses.includes(raffle.Int_DrawStatus)
  )

  return (
    <div className="mt-8">
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <Heading>Recent Raffles</Heading>
        {charity.Int_CharityStatus === 1 ? (
          <Button color="fuchsia" href="/raffles/create-raffle" className="flex items-center">
            <PlusIcon className="mr-2" />
            CREATE RAFFLE
          </Button>
        ) : (
          <div className="group relative">
            <Button disabled color="fuchsia">
              CREATE RAFFLE
            </Button>
            <div className="absolute top-full left-1/2 z-10 mt-1 w-max -translate-x-1/2 rounded bg-zinc-800 px-2 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100">
              Activate charity to create a raffle
            </div>
          </div>
        )}
      </div>

      {raffles.length === 0 ? (
        <p className="mt-4 text-zinc-500">No raffles created for this charity yet.</p>
      ) : (
        <Table className="mt-4">
          <TableHead>
            <TableRow>
              <TableHeader>Raffle Name</TableHeader>
              <TableHeader>Start Date</TableHeader>
              <TableHeader>End Date</TableHeader>
              <TableHeader className="group relative text-right">
                <div className="flex items-center justify-end gap-1">
                  Status
                  <div className="relative">
                    <button className="text-sm text-zinc-800 hover:text-white" title="Filter Statuses" type="button">
                      ⏷
                    </button>
                    <div className="absolute top-full right-0 z-10 mt-2 w-48 rounded-md border border-zinc-700 bg-zinc-50 p-2 text-sm opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                      {Object.entries(raffleStatusMap).map(([key, { label }]) => (
                        <label key={key} className="flex cursor-pointer items-center gap-2 py-1">
                          <input
                            type="checkbox"
                            value={key}
                            checked={selectedStatuses.includes(Number(key))}
                            onChange={() => toggleStatus(Number(key))}
                            className="accent-fuchsia-500"
                          />
                          {label}
                        </label>
                      ))}
                      <button
                        className="mt-2 w-full text-xs text-fuchsia-400 hover:text-fuchsia-200"
                        onClick={() => setSelectedStatuses([])}
                      >
                        Clear filters
                      </button>
                    </div>
                  </div>
                </div>
              </TableHeader>
            </TableRow>
          </TableHead>
          {filteredRaffles.length === 0 ? (
            <p className="mt-4 mb-50 text-zinc-500">No charities match your search.</p>
          ) : (
            <TableBody>
              {filteredRaffles.map((raffle) => {
                const { label, color } = raffleStatusMap[raffle?.Int_DrawStatus] ?? {
                  label: 'Unknown',
                  color: 'zinc',
                }
                return (
                  <TableRow
                    key={raffle.Guid_RaffleId}
                    href={`/raffles/${raffle.Guid_RaffleId}`}
                    title={`Raffle #${raffle.Guid_RaffleId}`}
                  >
                    <TableCell>{raffle.VC_RaffleName}</TableCell>
                    <TableCell>{format(new Date(raffle.Dt_SalesOpen), 'MMMM d, yyyy')}</TableCell>
                    <TableCell>{format(new Date(raffle.Dt_SalesClose), 'MMMM d, yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <Badge color={color}>{label}</Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          )}
        </Table>
      )}
    </div>
  )
}
