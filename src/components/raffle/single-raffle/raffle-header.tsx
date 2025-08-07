// components/RaffleHeader.tsx
'use client'

import { ChevronLeftIcon } from '@heroicons/react/16/solid'
import { format } from 'date-fns'
import { Badge } from '..//../badge'
import { Button } from '..//../button'
import { Heading } from '..//../heading'
import { Link } from '..//../link'

type Props = {
  raffle: any
  bannerUrl: string | null
  onActivate: () => void
  onDeactivate: () => void
}

const statusMap: Record<number, { label: string; color: string }> = {
  1: { label: 'Not Started', color: 'zinc' },
  2: { label: 'Active', color: 'lime' },
  3: { label: 'Sales Complete', color: 'amber' },
  4: { label: 'Draw Complete', color: 'cyan' },
  5: { label: 'Paid Out', color: 'emerald' },
  6: { label: 'On Hold', color: 'red' },
}

export function RaffleHeader({ raffle, bannerUrl, onActivate, onDeactivate }: Props) {
  const { label, color } = statusMap[raffle?.Int_DrawStatus] ?? {
    label: 'Unknown',
    color: 'zinc',
  }

  return (
    <>
      <div className="max-lg:hidden">
        <Link
          href={`/charities/${raffle.Guid_CharityId}`}
          className="inline-flex items-center gap-2 text-sm/6 text-zinc-500 dark:text-zinc-400"
        >
          <ChevronLeftIcon className="size-4 fill-zinc-400 dark:fill-zinc-500" />
          Back to Charity
        </Link>
      </div>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="w-64 shrink-0">
            <img
              className="aspect-[2/1] w-full rounded-lg object-cover shadow-sm"
              src={bannerUrl || `https://placehold.co/400x200?text=No+Charity+Banner`}
              alt=""
            />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Heading>{raffle.VC_RaffleName}</Heading>
              <Badge color={color}>{label}</Badge>
            </div>
            <div className="mt-2 text-sm/6 text-zinc-500">
              {format(new Date(raffle.Dt_SalesOpen), 'MMMM d, yyyy')} to{' '}
              {format(new Date(raffle.Dt_SalesClose), 'MMMM d, yyyy')} <span aria-hidden="true">·</span> at{' '}
              {raffle.VC_RaffleLocation}
            </div>
            <div className="mt-2 text-sm/6 text-zinc-500">License No: {raffle.VC_LicenseNumb}</div>
          </div>
        </div>
        <div className="flex gap-4">
          {raffle.Int_DrawStatus === 1 && (
            <Button outline href="">
              Edit Raffle Information
            </Button>
          )}
          {raffle.Int_DrawStatus === 1 && (
            <Button color="lime" onClick={onActivate} className="flex items-center">
              Activate Raffle
            </Button>
          )}
          {raffle.Int_DrawStatus === 2 && (
            <Button color="red" onClick={onDeactivate} className="flex items-center">
              Put On Hold
            </Button>
          )}
          {raffle.Int_DrawStatus === 4 && (
            <Button color="cyan" onClick={onDeactivate} className="flex items-center">
              Paid Out
            </Button>
          )}
        </div>
      </div>
    </>
  )
}
