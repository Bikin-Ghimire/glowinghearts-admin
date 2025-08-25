// components/Raffle/refund-dialog.tsx
'use client'

import { Dialog, DialogActions, DialogBody, DialogDescription, DialogTitle } from '@/components/dialog'
import { CheckCircleIcon } from '@heroicons/react/16/solid'
import { useSession } from 'next-auth/react'
import { useMemo, useState } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  raffleId: string
  purchaseId: string | null
  intentId?: string
  totalAmount?: number
  onSuccess?: () => Promise<void> | void
}

export default function RefundDialog({ open, onClose, raffleId, purchaseId, intentId, totalAmount, onSuccess }: Props) {
  const { data: session } = useSession()
  const [notes, setNotes] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Confirmation must match exactly (case-sensitive)
  const confirmOk = confirmText.trim() === 'CONFIRM REFUND'

  // Disabled until we have everything required + explicit confirmation
  const disabled = useMemo(
    () => !session || !purchaseId || !raffleId || !intentId || totalAmount == null || !confirmOk,
    [session, purchaseId, raffleId, intentId, totalAmount, confirmOk]
  )

  async function handleSubmit() {
    if (disabled || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      // Initiate on platform API (creates Stripe refund on connected account)
      const res = await fetch('/api/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchaseGuid: purchaseId, // server will look up VC_CharityKey + Guid_IntentId
          amount: totalAmount, // omit for full refund if you prefer
          note: notes,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || `Refund initiation failed (${res.status})`)
      }

      // Now let the webhook finalize your backend state.
      // Refresh the row; most cases your backend will already be up-to-date when webhook lands.
      await onSuccess?.()
      setSuccess(true)
    } catch (e: any) {
      setError(e?.message || 'Refund failed')
    } finally {
      setSubmitting(false)
    }
  }

  // Reset transient state when dialog closes
  function handleClose() {
    setNotes('')
    setConfirmText('')
    setError(null)
    setSuccess(false)
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>{success ? 'Refund Successful' : 'Refund Purchase'}</DialogTitle>
      <DialogDescription>
        {success ? (
          <span className="text-zinc-600 dark:text-zinc-300">
            The purchaser has been refunded and this row’s details have been refreshed.
          </span>
        ) : (
          <>
            Refunding will return the full amount to the purchaser and <span className="font-semibold">cannot</span> be
            undone.
            {!intentId && (
              <span className="ml-1 text-red-600 dark:text-red-400">No Intent ID found for this purchase.</span>
            )}
          </>
        )}
      </DialogDescription>

      <DialogBody>
        {success ? (
          <div className="flex items-start gap-3 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-200">
            <CheckCircleIcon className="mt-0.5 h-5 w-5 flex-none" />
            <div>
              <div className="font-medium">Refund completed</div>
              <div className="mt-1 text-xs opacity-90">
                Amount:&nbsp;{totalAmount != null ? `$${Number(totalAmount).toFixed(2)}` : '—'}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            {/* Refund ID (full-width, wraps) */}
            <div className="rounded border border-zinc-200 p-2 dark:border-zinc-700">
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Refund ID (Intent)</div>
              <div className="font-mono break-all text-zinc-900 dark:text-zinc-100">{intentId ?? '—'}</div>
            </div>

            {/* Refund Amount (full-width) */}
            <div className="rounded border border-zinc-200 p-2 dark:border-zinc-700">
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Refund Amount</div>
              <div className="font-medium text-zinc-900 dark:text-zinc-100">
                {totalAmount != null ? `$${Number(totalAmount).toFixed(2)}` : '—'}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="refund-notes" className="mb-1 block text-xs text-zinc-600 dark:text-zinc-300">
                Notes
              </label>
              <textarea
                id="refund-notes"
                rows={3}
                className="w-full rounded-md border border-zinc-300 bg-white p-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                placeholder="Why is this being refunded?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Confirmation */}
            <div>
              <label htmlFor="confirm-text" className="mb-1 block text-xs text-zinc-600 dark:text-zinc-300">
                Type <span className="font-semibold">CONFIRM REFUND</span> to enable the refund (case-sensitive)
              </label>
              <input
                id="confirm-text"
                type="text"
                className="w-full rounded-md border border-zinc-300 bg-white p-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus-visible:ring-indigo-600"
                placeholder="CONFIRM REFUND"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                inputMode="text"
              />
              {!confirmOk && confirmText.length > 0 && (
                <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                  Text must match exactly: <span className="font-mono">CONFIRM REFUND</span>
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                {error}
              </div>
            )}
          </div>
        )}
      </DialogBody>

      <DialogActions>
        {success ? (
          <button
            type="button"
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
            onClick={handleClose}
          >
            Close
          </button>
        ) : (
          <>
            <button
              type="button"
              className="inline-flex items-center rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="inline-flex items-center rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={handleSubmit}
              disabled={submitting || disabled}
            >
              {submitting ? 'Refunding…' : 'Confirm Refund'}
            </button>
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}
