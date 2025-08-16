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
  1: { label: 'Not Drawn', color: 'zinc' },
  2: { label: 'Winner Drawn', color: 'lime' },
  3: { label: 'Paid Out', color: 'emerald' },
  4: { label: 'Unclaimed', color: 'amber' },
  5: { label: 'Donated', color: 'cyan' },
}

export function RaffleInfoTab({ raffle, prizes, buyIns }: Props) {
  const { markPaidOut, markDonated, loadingId, error } = usePrizeActions()
  const [localError, setLocalError] = useState<string | null>(null)

  // ✅ Local mirror of prizes for instant UI updates
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
    if (action === 'paid') ok = await markPaidOut(prizeId!, trimmed)  // sets to 3
    if (action === 'donate') ok = await markDonated(prizeId!, trimmed)  // sets to 5
    if (!ok) {
      setLocalError('Failed to update status.')
      return
    }

    // ✅ Patch just the affected row locally
    setRows(prev =>
      prev.map(p =>
        p.Guid_PrizeId === prizeId
          ? {
              ...p,
              Int_Prize_Status: action === 'paid' ? 3 : 5,
            }
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
        className="inline-flex cursor-not-allowed items-center rounded-md border border-gray-300 bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-500 opacity-70"
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
    <div className="mt-5 space-y-8 text-sm text-gray-500">
      {!!(error || localError) && (
        <div className="rounded-md bg-red-50 p-3 text-xs text-red-700">{localError || error}</div>
      )}

      {/* Game Details */}
      <section>
        <h3 className="text-base/7 font-semibold text-gray-900">Game Details</h3>
        <div className="prose prose-sm mt-2 max-w-none">
          <ShowMore lines={3}>
            <div dangerouslySetInnerHTML={{ __html: raffle.Txt_GameDetails || 'No game details available.' }} />
          </ShowMore>
        </div>
      </section>

      {/* Game Rules */}
      <section>
        <h3 className="text-base/7 font-semibold text-gray-900">Game Rules</h3>
        <div className="prose prose-sm mt-2 max-w-none">
          <ShowMore lines={3}>
            <div dangerouslySetInnerHTML={{ __html: raffle.Txt_GameRules || 'No game rules available.' }} />
          </ShowMore>
        </div>
      </section>

      {/* Prizes Table */}
      <section>
        <h3 className="text-base/7 font-semibold text-gray-900">Prize Details</h3>
        <div className="mt-2 overflow-x-auto">
          <p>
            <b>Prize Claim Period:</b> {raffle.Int_UnClaimedTimeOut} days
          </p>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Description</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Value</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Draw Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Winner</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {prizes.map((prize) => {
                const { label, color } = statusMap[prize.Int_Prize_Status] || {
                  label: 'Unknown',
                  color: 'gray',
                }
                return (
                  <tr key={prize.Guid_PrizeId}>
                    <td className="px-4 py-3 text-sm text-gray-900">{prize.VC_Description}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">${prize.Dec_Value}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {prize.Dt_Draw && prize.Dt_Draw !== '0000-00-00 00:00:00'
                        ? format(new Date(prize.Dt_Draw), 'MMMM d, yyyy h:mm a')
                        : 'TBD'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{prize.VC_Note}
                      <Badge color={color as 'fuchsia' | 'zinc' | 'green' | 'red' | 'yellow' | 'blue'}>{label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {!prize.Guid_TicketId || prize.Guid_TicketId === 'null'
                        ? 'No Winner Selected'
                        : prize.Guid_TicketId}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{renderActionButton(prize)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Ticket Bundles Table */}
      <section>
        <h3 className="text-base/7 font-semibold text-gray-900">Ticket Bundles</h3>
        <div className="mt-2 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Description</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Number of Tickets</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {buyIns.map((buyIn) => (
                <tr key={buyIn.Guid_BuyInId}>
                  <td className="px-4 py-3 text-sm text-gray-900">{buyIn.VC_Description}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{buyIn.Int_NumbTicket}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">${buyIn.Dec_Price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog
        open={open}
        onClose={resetDialog}        // allows Esc/overlay close
        size="md"
        aria-label="Add note for status change"
      >
        <DialogTitle>
          {action === 'paid' ? 'Mark Prize as Paid Out' : 'Mark Prize as Donated'}
        </DialogTitle>

        <DialogDescription>
          Add a note (required). Plain text only.
        </DialogDescription>

        <DialogBody>
          <textarea
            rows={6}
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX))}
            onBlur={() => setTouched(true)}
            className="w-full rounded-md border border-zinc-300 bg-white p-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-900 dark:border-zinc-700"
            placeholder="e.g., Winner verified and paid via e-transfer on Aug 8, 2025."
          />
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className={`text-red-600 ${touched && !note.trim() ? '' : 'invisible'}`}>
              Note is required.
            </span>
            <span className="text-zinc-400">{note.length}/{NOTE_MAX}</span>
          </div>
        </DialogBody>

        <DialogActions>
          <button
            type="button"
            onClick={resetDialog}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-200 dark:border-zinc-700"
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
