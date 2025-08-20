// components/RaffleHeader.tsx
'use client'

import { ChevronLeftIcon } from '@heroicons/react/16/solid'
import { format } from 'date-fns'
import { useState } from 'react'
import { Badge } from '..//../badge'
import { Button } from '..//../button'
import { Dialog, DialogActions, DialogBody, DialogDescription, DialogTitle } from '..//../dialog'
import { Heading } from '..//../heading'
import { Link } from '..//../link'

type Props = {
  raffle: any
  bannerUrl: string | null
  onActivate: () => void
  onDeactivate: () => void
}

const statusMap: Record<
  number,
  {
    label: string
    color:
      | 'red' | 'orange' | 'amber' | 'yellow' | 'lime' | 'green' | 'emerald'
      | 'teal' | 'cyan' | 'sky' | 'blue' | 'indigo' | 'violet' | 'purple'
      | 'fuchsia' | 'pink' | 'rose' | 'zinc'
  }
> = {
  1: { label: 'Not Started', color: 'zinc' },
  2: { label: 'Active', color: 'lime' },
  3: { label: 'Sales Complete', color: 'amber' },
  4: { label: 'Draw Complete', color: 'cyan' },
  5: { label: 'Paid Out', color: 'emerald' },
  6: { label: 'On Hold', color: 'red' },
}

export function RaffleHeader({ raffle, bannerUrl, onActivate, onDeactivate }: Props) {
  const { label, color } = statusMap[raffle?.Int_DrawStatus] ?? { label: 'Unknown', color: 'zinc' }

  // confirmation dialog state
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const meetsConfirmation = confirmText.trim() === 'CONFIRM HOLD'

  const handleConfirmHold = async () => {
    if (!meetsConfirmation || submitting) return
    try {
      setSubmitting(true)
      await onDeactivate()
      setConfirmOpen(false)
      setConfirmText('')
    } finally {
      setSubmitting(false)
    }
  }

  const salesOpen = new Date(raffle.Dt_SalesOpen)
  const salesClose = new Date(raffle.Dt_SalesClose)

  return (
    <>
      {/* Breadcrumb back link */}
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
              className="aspect-[2/1] w-full rounded-lg object-cover shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800"
              src={bannerUrl || `https://placehold.co/400x200?text=No+Charity+Banner`}
              alt={`${raffle?.VC_RaffleName ?? 'Raffle'} banner`}
            />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Heading>{raffle.VC_RaffleName}</Heading>
              <Badge color={color}>{label}</Badge>
            </div>

            <div className="mt-2 text-sm/6 text-zinc-500 dark:text-zinc-400">
              <time dateTime={salesOpen.toISOString()}>
                {format(salesOpen, 'MMMM d, yyyy')}
              </time>{' '}
              to{' '}
              <time dateTime={salesClose.toISOString()}>
                {format(salesClose, 'MMMM d, yyyy')}
              </time>{' '}
              <span aria-hidden="true">·</span>{' '}
              <span className="text-zinc-600 dark:text-zinc-300">{raffle.VC_RaffleLocation}</span>
            </div>

            <div className="mt-2 text-sm/6 text-zinc-500 dark:text-zinc-400">
              License No: <span className="text-zinc-700 dark:text-zinc-200">{raffle.VC_LicenseNumb}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          {/* Edit allowed only before start */}
          {raffle.Int_DrawStatus === 1 && (
            <Button outline href="">
              Edit Raffle Information
            </Button>
          )}

          {/* Activate if Not Started OR On Hold */}
          {(raffle.Int_DrawStatus === 6 || raffle.Int_DrawStatus === 1) && (
            <Button color="lime" onClick={onActivate} className="flex items-center">
              Activate Raffle
            </Button>
          )}

          {/* Put on hold only when Active */}
          {raffle.Int_DrawStatus === 2 && (
            <Button color="red" onClick={() => setConfirmOpen(true)} className="flex items-center">
              Put On Hold
            </Button>
          )}
        </div>
      </div>

      {/* Confirmation dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} size="sm" aria-label="Confirm put on hold">
        <DialogTitle>Confirm: Put Raffle On Hold</DialogTitle>
        <DialogDescription>
          To confirm, type <b>CONFIRM HOLD</b> exactly, then press Confirm.
        </DialogDescription>

        <DialogBody>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="CONFIRM HOLD"
            className="mt-2 w-full rounded-md border border-zinc-300 bg-white p-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
          />
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            This will pause sales and actions until the raffle is reactivated. Are you sure you want to proceed?
          </p>
        </DialogBody>

        <DialogActions>
          <Button outline onClick={() => setConfirmOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button color="red" onClick={handleConfirmHold} disabled={!meetsConfirmation || submitting}>
            {submitting ? 'Holding…' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}