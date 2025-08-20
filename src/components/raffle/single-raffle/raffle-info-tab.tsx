// components/Raffle/RaffleInfoTab.tsx
'use client'

import { usePrizeActions } from '@/hooks/use-prize-actions'
import { ShowMore } from '@re-dev/react-truncate'
import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import { Badge } from '../../badge'
import { Dialog, DialogTitle, DialogDescription, DialogBody, DialogActions } from '@/components/dialog'

type Props = {
  raffle: any
  prizes: any[]
  buyIns: any[]
}

type ActionType = 'paid' | 'donate'
const NOTE_MAX = 1000

const statusMap: Record<number, { label: string; color: string }> = {
  1: { label: 'Not Drawn',  color: 'zinc' },
  2: { label: 'Winner Drawn', color: 'lime' },
  3: { label: 'Paid Out',    color: 'emerald' },
  4: { label: 'Unclaimed',   color: 'amber' },
  5: { label: 'Donated',     color: 'cyan' },
}

export function RaffleInfoTab({ raffle, prizes, buyIns }: Props) {
  const { markPaidOut, markDonated, loadingId, error } = usePrizeActions()
  const [localError, setLocalError] = useState<string | null>(null)

  // Local mirror of prizes for instant UI updates
  const [rows, setRows] = useState<any[]>(prizes)
  useEffect(() => setRows(prizes), [prizes])

  // Dialog state
  const [open, setOpen] = useState(false)
  const [action, setAction] = useState<ActionType | null>(null)
  const [prizeId, setPrizeId] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [touched, setTouched] = useState(false)

  const resetDialog = () => {
    setOpen(false)
    setAction(null)
    setPrizeId(null)
    setNote('')
    setTouched(false)
  }

  const openDialog = (id: string, a: ActionType) => {
    setPrizeId(id)
    setAction(a)
    setOpen(true)
  }

  const submit = async () => {
    const trimmed = note.trim()
    if (!trimmed) {
      setTouched(true)
      return
    }
    let ok = false
    if (action === 'paid') ok = await markPaidOut(prizeId!, trimmed)   // sets to 3
    if (action === 'donate') ok = await markDonated(prizeId!, trimmed) // sets to 5
    if (!ok) {
      setLocalError('Failed to update status.')
      return
    }

    // Patch affected row locally
    setRows(prev =>
      prev.map(p =>
        p.Guid_PrizeId === prizeId
          ? { ...p, Int_Prize_Status: action === 'paid' ? 3 : 5 }
          : p
      )
    )
    setLocalError(null)
    resetDialog()
  }

  const renderActionButton = (prize: any) => {
    const status = Number(prize.Int_Prize_Status)
    const isLoading = loadingId === prize.Guid_PrizeId

    const Disabled = ({ text }: { text: string }) => (
      <button
        type="button"
        className="inline-flex cursor-not-allowed items-center rounded-md border border-zinc-300 bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-500 opacity-70 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
        disabled
        aria-disabled
      >
        {text}
      </button>
    )

    if (status === 2) {
      return (
        <button
          type="button"
          onClick={() => openDialog(prize.Guid_PrizeId, 'paid')}
          disabled={isLoading}
          className="inline-flex items-center rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-60"
        >
          {isLoading ? 'Updating…' : 'Mark Paid Out'}
        </button>
      )
    }

    if (status === 4) {
      return (
        <button
          type="button"
          onClick={() => openDialog(prize.Guid_PrizeId, 'donate')}
          disabled={isLoading}
          className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {isLoading ? 'Updating…' : 'Mark Donated'}
        </button>
      )
    }

    return <Disabled text="No action needed" />
  }

  return (
    <div className="mt-5 space-y-8 text-sm text-zinc-600 dark:text-zinc-300">
      {!!(error || localError) && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          {localError || error}
        </div>
      )}

      {/* Game Details */}
      <section>
        <h3 className="text-base/7 font-semibold text-zinc-900 dark:text-zinc-100">Game Details</h3>
        <div className="prose prose-sm mt-2 max-w-none text-zinc-700 dark:prose-invert dark:text-zinc-200">
          <ShowMore lines={3}>
            <div dangerouslySetInnerHTML={{ __html: raffle.Txt_GameDetails || 'No game details available.' }} />
          </ShowMore>
        </div>
      </section>

      {/* Game Rules */}
      <section>
        <h3 className="text-base/7 font-semibold text-zinc-900 dark:text-zinc-100">Game Rules</h3>
        <div className="prose prose-sm mt-2 max-w-none text-zinc-700 dark:prose-invert dark:text-zinc-200">
          <ShowMore lines={3}>
            <div dangerouslySetInnerHTML={{ __html: raffle.Txt_GameRules || 'No game rules available.' }} />
          </ShowMore>
        </div>
      </section>

      {/* Prizes Table */}
      <section>
        <h3 className="text-base/7 font-semibold text-zinc-900 dark:text-zinc-100">Prize Details</h3>

        <div className="mt-2">
          <p className="text-zinc-700 dark:text-zinc-300">
            <b className="text-zinc-900 dark:text-zinc-100">Prize Claim Period:</b> {raffle.Int_UnClaimedTimeOut} days
          </p>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">Description</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">Value</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">Draw Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">Winner</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-900">
              {rows.map((prize) => {
                const { label, color } = statusMap[prize.Int_Prize_Status] || { label: 'Unknown', color: 'zinc' }
                return (
                  <tr key={prize.Guid_PrizeId}>
                    <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100">{prize.VC_Description}</td>
                    <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">${prize.Dec_Value}</td>
                    <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">
                      {prize.Dt_Draw && prize.Dt_Draw !== '0000-00-00 00:00:00'
                        ? format(new Date(prize.Dt_Draw), 'MMMM d, yyyy h:mm a')
                        : 'TBD'}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">
                      {prize.VC_Note && (
                        <span className="mr-2 inline-block max-w-[24ch] truncate align-middle text-zinc-500 dark:text-zinc-400">
                          {prize.VC_Note}
                        </span>
                      )}
                      <Badge color={color as any}>{label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">
                      {!prize.Guid_TicketId || prize.Guid_TicketId === 'null'
                        ? 'No Winner Selected'
                        : prize.Guid_TicketId}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">
                      {renderActionButton(prize)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Ticket Bundles Table */}
      <section>
        <h3 className="text-base/7 font-semibold text-zinc-900 dark:text-zinc-100">Ticket Bundles</h3>
        <div className="mt-2 overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">Description</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">Number of Tickets</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-900">
              {buyIns.map((buyIn) => (
                <tr key={buyIn.Guid_BuyInId}>
                  <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100">{buyIn.VC_Description}</td>
                  <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">{buyIn.Int_NumbTicket}</td>
                  <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">${buyIn.Dec_Price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Dialog */}
      <Dialog open={open} onClose={resetDialog} size="md" aria-label="Add note for status change">
        <DialogTitle className="text-zinc-900 dark:text-zinc-100">
          {action === 'paid' ? 'Mark Prize as Paid Out' : 'Mark Prize as Donated'}
        </DialogTitle>
        <DialogDescription className="text-zinc-600 dark:text-zinc-300">
          Add a note (required). Plain text only.
        </DialogDescription>

        <DialogBody>
          <textarea
            rows={6}
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX))}
            onBlur={() => setTouched(true)}
            className="w-full rounded-md border border-zinc-300 bg-white p-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
            placeholder="e.g., Winner verified and paid via e-transfer on Aug 8, 2025."
          />
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className={`text-red-600 dark:text-red-400 ${touched && !note.trim() ? '' : 'invisible'}`}>
              Note is required.
            </span>
            <span className="text-zinc-400 dark:text-zinc-500">{note.length}/{NOTE_MAX}</span>
          </div>
        </DialogBody>

        <DialogActions>
          <button
            type="button"
            onClick={resetDialog}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!note.trim() || (prizeId ? loadingId === prizeId : false)}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {prizeId && loadingId === prizeId ? 'Saving…' : 'Save & Update'}
          </button>
        </DialogActions>
      </Dialog>
    </div>
  )
}