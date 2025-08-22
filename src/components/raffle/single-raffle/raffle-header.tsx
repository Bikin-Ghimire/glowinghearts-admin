// app/components/raffle/raffle-header.tsx
'use client'

import { ChevronLeftIcon, PencilSquareIcon } from '@heroicons/react/16/solid'
import { format } from 'date-fns'
import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Badge } from '..//../badge'
import { Button } from '..//../button'
import { Dialog, DialogActions, DialogBody, DialogDescription, DialogTitle } from '..//../dialog'
import { Heading } from '..//../heading'
import { Link } from '..//../link'
import { useRaffleInlineEdits } from '@/hooks/use-raffle-inline-edits'
import { isValidImageUrl, toLocalISO, toServerDT } from '@/lib/validators'
import RichTextEditorTiptap from '@/components/rich-text' // used in InfoTab; safe to keep import style consistent

type Props = {
  raffle: any
  bannerUrl: string | null
  onActivate: () => void
  onDeactivate: () => void
}

const statusMap: Record<number, { label: string; color:
  | 'red' | 'orange' | 'amber' | 'yellow' | 'lime' | 'green' | 'emerald'
  | 'teal' | 'cyan' | 'sky' | 'blue' | 'indigo' | 'violet' | 'purple'
  | 'fuchsia' | 'pink' | 'rose' | 'zinc'
}> = {
  1: { label: 'Not Started', color: 'zinc' },
  2: { label: 'Active', color: 'lime' },
  3: { label: 'Sales Complete', color: 'amber' },
  4: { label: 'Draw Complete', color: 'cyan' },
  5: { label: 'Paid Out', color: 'emerald' },
  6: { label: 'On Hold', color: 'red' },
}

export function RaffleHeader({ raffle, bannerUrl, onActivate, onDeactivate }: Props) {
  const { data: session } = useSession()
  const access = Number((session as any)?.user?.charityAccess?.[0]?.Int_UserAccess ?? 3) // <- adjust if needed
  const canControlByRole = access === 1 || access === 2
  const canEditByStatus = raffle?.Int_DrawStatus === 1
  const canEdit = canControlByRole && canEditByStatus

  const { label, color } = statusMap[raffle?.Int_DrawStatus] ?? { label: 'Unknown', color: 'zinc' }

  // Hold dialog
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [submittingHold, setSubmittingHold] = useState(false)
  const meetsConfirmation = confirmText.trim() === 'CONFIRM HOLD'

  // Core edit dialog state
  const [editOpen, setEditOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const salesOpenISO = toLocalISO(raffle.Dt_SalesOpen || raffle.Dt_SaleOpen)
  const salesCloseISO = toLocalISO(raffle.Dt_SalesClose || raffle.Dt_SaleClose)

  const [form, setForm] = useState({
    VC_LicenseNumb: raffle.VC_LicenseNumb ?? '',
    VC_RaffleName: raffle.VC_RaffleName ?? '',
    VC_RaffleLocation: raffle.VC_RaffleLocation ?? '',
    Dt_SaleOpenISO: salesOpenISO,   // datetime-local value
    Dt_SaleCloseISO: salesCloseISO, // datetime-local value
    // Int_TimeFrame: raffle.Int_TimeFrame ?? 1,
    Int_UnClaimedTimeOut: raffle.Int_UnClaimedTimeOut ?? 30,
    VC_BannerLocation: bannerUrl ?? '',
  })
  useEffect(() => {
    setForm((f) => ({
      ...f,
      VC_LicenseNumb: raffle.VC_LicenseNumb ?? '',
      VC_RaffleName: raffle.VC_RaffleName ?? '',
      VC_RaffleLocation: raffle.VC_RaffleLocation ?? '',
      Dt_SaleOpenISO: toLocalISO(raffle.Dt_SalesOpen || raffle.Dt_SaleOpen),
      Dt_SaleCloseISO: toLocalISO(raffle.Dt_SalesClose || raffle.Dt_SaleClose),
      Int_TimeFrame: raffle.Int_TimeFrame ?? 1,
      Int_UnClaimedTimeOut: raffle.Int_UnClaimedTimeOut ?? 30,
    }))
  }, [raffle])

  const [localBanner, setLocalBanner] = useState<string | null>(bannerUrl)
  useEffect(() => setLocalBanner(bannerUrl), [bannerUrl])

  const [bannerValid, setBannerValid] = useState(!form.VC_BannerLocation || isValidImageUrl(form.VC_BannerLocation))

  const { updateRaffleCore, updateBanner } = useRaffleInlineEdits()

  // VALIDATION
  const nowLocalMin = new Date().toISOString().slice(0, 16)
  const start = form.Dt_SaleOpenISO ? new Date(form.Dt_SaleOpenISO) : null
  const end = form.Dt_SaleCloseISO ? new Date(form.Dt_SaleCloseISO) : null
  const fieldsFilled =
    form.VC_LicenseNumb.trim() &&
    form.VC_RaffleName.trim() &&
    form.VC_RaffleLocation.trim() &&
    form.Dt_SaleOpenISO &&
    form.Dt_SaleCloseISO &&
    // String(form.Int_TimeFrame) !== '' &&
    String(form.Int_UnClaimedTimeOut) !== '' &&
    form.VC_BannerLocation.trim()
  const datesOK =
    !!start &&
    !!end &&
    start.getTime() > Date.now() && // start in future
    end.getTime() > start.getTime() // end after start

  const allValid = !!fieldsFilled && datesOK && bannerValid

  async function saveCoreAndBanner() {
    if (!allValid) {
      alert('Please fix validation errors before saving.')
      return
    }
    setSaving(true)
    try {
      await updateRaffleCore(raffle.Guid_RaffleId, {
        VC_LicenseNumb: form.VC_LicenseNumb.trim(),
        VC_RaffleName: form.VC_RaffleName.trim(),
        VC_RaffleLocation: form.VC_RaffleLocation.trim(),
        Dt_SaleOpen: toServerDT(form.Dt_SaleOpenISO),
        Dt_SaleClose: toServerDT(form.Dt_SaleCloseISO),
        Int_TimeFrame: 3,
        Int_UnClaimedTimeOut: Number(form.Int_UnClaimedTimeOut),
      })
      if (form.VC_BannerLocation && form.VC_BannerLocation !== localBanner) {
        await updateBanner(raffle.Guid_RaffleId, form.VC_BannerLocation)
        setLocalBanner(form.VC_BannerLocation)
      }
      setEditOpen(false)
      alert('Saved.')
    } catch (e: any) {
      alert(e?.message || 'Failed to save updates.')
    } finally {
      setSaving(false)
    }
  }

  async function handleConfirmHold() {
    if (!meetsConfirmation || submittingHold) return
    try {
      setSubmittingHold(true)
      await onDeactivate()
      setConfirmOpen(false)
      setConfirmText('')
    } finally {
      setSubmittingHold(false)
    }
  }

  const salesOpen = new Date(raffle.Dt_SalesOpen)
  const salesClose = new Date(raffle.Dt_SalesClose)

  return (
    <>
      {/* Breadcrumb */}
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
          <div className="w-64 shrink-0 relative">
            <img
              className="aspect-[2/1] w-full rounded-lg object-cover shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800"
              src={localBanner || `https://placehold.co/400x200?text=No+Charity+Banner`}
              alt={`${raffle?.VC_RaffleName ?? 'Raffle'} banner`}
            />
            {canEdit && (
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="absolute right-2 top-2 rounded-md bg-black/60 px-2 py-1 text-xs text-white hover:bg-black/70"
                title="Edit banner and raffle info"
              >
                <span className="inline-flex items-center gap-1"><PencilSquareIcon className="size-4" /> Edit</span>
              </button>
            )}
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
          {/* Only Access 1/2 + Not Started */}
          {canEdit && (
            <Button outline onClick={() => setEditOpen(true)}>
              Edit Raffle Information
            </Button>
          )}

          {/* Activate: Access 1/2 AND (Not Started or On Hold) */}
          {canControlByRole && (raffle.Int_DrawStatus === 6 || raffle.Int_DrawStatus === 1) && (
            <Button color="lime" onClick={onActivate} className="flex items-center">
              Activate Raffle
            </Button>
          )}

          {/* Put on hold: Access 1/2 AND Active */}
          {canControlByRole && raffle.Int_DrawStatus === 2 && (
            <Button color="red" onClick={() => setConfirmOpen(true)} className="flex items-center">
              Put On Hold
            </Button>
          )}
        </div>
      </div>

      {/* Hold Confirmation */}
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
            This will pause sales and actions until the raffle is reactivated.
          </p>
        </DialogBody>

        <DialogActions>
          <Button outline onClick={() => setConfirmOpen(false)} disabled={submittingHold}>
            Cancel
          </Button>
          <Button color="red" onClick={handleConfirmHold} disabled={!meetsConfirmation || submittingHold}>
            {submittingHold ? 'Holding…' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Core Edit dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} size="lg" aria-label="Edit raffle">
        <DialogTitle>Edit Raffle Information</DialogTitle>
        <DialogDescription>Changes are only allowed while status is “Not Started”.</DialogDescription>
        <DialogBody>
          {/* dark-mode polish for pickers */}
          <style jsx global>{`
            .dark input[type='date']::-webkit-calendar-picker-indicator,
            .dark input[type='time']::-webkit-calendar-picker-indicator,
            .dark input[type='datetime-local']::-webkit-calendar-picker-indicator {
              filter: invert(1) opacity(0.9);
            }
            input:-webkit-autofill { box-shadow: 0 0 0px 1000px transparent inset; }
            .dark input:-webkit-autofill { -webkit-text-fill-color:#e4e4e7; transition: background-color 9999s ease-in-out 0s; caret-color:#e4e4e7; }
          `}</style>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block">Raffle Name</span>
              <input className="w-full rounded-md border p-2" value={form.VC_RaffleName}
                onChange={(e)=>setForm({...form, VC_RaffleName:e.target.value})} required />
            </label>

            <label className="text-sm">
              <span className="mb-1 block">License No</span>
              <input className="w-full rounded-md border p-2" value={form.VC_LicenseNumb}
                onChange={(e)=>setForm({...form, VC_LicenseNumb:e.target.value})} required />
            </label>

            <label className="text-sm sm:col-span-2">
              <span className="mb-1 block">Location</span>
              <input className="w-full rounded-md border p-2" value={form.VC_RaffleLocation}
                onChange={(e)=>setForm({...form, VC_RaffleLocation:e.target.value})} required />
            </label>

            <label className="text-sm">
              <span className="mb-1 block">Sales Open</span>
              <input type="datetime-local" className="w-full rounded-md border p-2"
                value={form.Dt_SaleOpenISO}
                min={nowLocalMin}
                onChange={(e)=>setForm({...form, Dt_SaleOpenISO:e.target.value})} required />
              {form.Dt_SaleOpenISO && new Date(form.Dt_SaleOpenISO) <= new Date() && (
                <p className="mt-1 text-xs text-red-600">Start must be in the future.</p>
              )}
            </label>

            <label className="text-sm">
              <span className="mb-1 block">Sales Close</span>
              <input type="datetime-local" className="w-full rounded-md border p-2"
                value={form.Dt_SaleCloseISO}
                min={form.Dt_SaleOpenISO || nowLocalMin}
                onChange={(e)=>setForm({...form, Dt_SaleCloseISO:e.target.value})} required />
              {form.Dt_SaleOpenISO && form.Dt_SaleCloseISO && new Date(form.Dt_SaleCloseISO) <= new Date(form.Dt_SaleOpenISO) && (
                <p className="mt-1 text-xs text-red-600">End must be after start.</p>
              )}
            </label>

            {/* <label className="text-sm">
              <span className="mb-1 block">Prize Time Frame</span>
              <input type="number" min={0} className="w-full rounded-md border p-2" value={form.Int_TimeFrame}
                onChange={(e)=>setForm({...form, Int_TimeFrame:Number(e.target.value)})} required />
            </label> */}

            <label className="text-sm">
              <span className="mb-1 block">Unclaimed Timeout (days)</span>
              <input type="number" min={0} className="w-full rounded-md border p-2" value={form.Int_UnClaimedTimeOut}
                onChange={(e)=>setForm({...form, Int_UnClaimedTimeOut:Number(e.target.value)})} required />
            </label>

            <label className="text-sm sm:col-span-2">
              <span className="mb-1 block">Banner URL (image)</span>
              <input className="w-full rounded-md border p-2" value={form.VC_BannerLocation}
                onChange={(e)=>{
                  const v = e.target.value
                  setForm({...form, VC_BannerLocation: v})
                  setBannerValid(!v || isValidImageUrl(v))
                }} required />
              {!bannerValid && form.VC_BannerLocation && (
                <p className="mt-1 text-xs text-red-600">Enter a valid image URL (.jpg, .png, .webp, …)</p>
              )}
              {bannerValid && form.VC_BannerLocation && (
                <div className="mt-2">
                  <p className="mb-1 text-xs text-zinc-500">Preview:</p>
                  <img
                    src={form.VC_BannerLocation}
                    alt="Banner preview"
                    className="max-h-32 rounded border border-zinc-200 dark:border-zinc-700"
                    onError={()=>setBannerValid(false)}
                  />
                </div>
              )}
            </label>
          </div>
        </DialogBody>
        <DialogActions>
          <Button outline onClick={()=>setEditOpen(false)} disabled={saving}>Cancel</Button>
          <Button onClick={saveCoreAndBanner} disabled={saving || !allValid}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}