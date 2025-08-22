// app/components/raffle-info-tab.tsx
'use client'

import { Dialog, DialogActions, DialogBody, DialogDescription, DialogTitle } from '@/components/dialog'
import RichTextEditorTiptap from '@/components/rich-text'
import { usePrizeActions } from '@/hooks/use-prize-actions'
import { useRaffleInlineEdits } from '@/hooks/use-raffle-inline-edits'
import { PRIZE_TYPES, type PrizeType } from '@/lib/prize-rules'
import { toLocalISO, toServerDT } from '@/lib/validators'
import { PencilSquareIcon } from '@heroicons/react/16/solid'
import { ShowMore } from '@re-dev/react-truncate'
import { format } from 'date-fns'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Badge } from '../../badge'

type Props = {
  raffle: any
  prizes: any[]
  buyIns: any[]
  onUpdated?: () => void
}

type ActionType = 'paid' | 'donate'
const NOTE_MAX = 1000

type PrizeFormState = {
  Int_Place: number
  Int_Prize_Type: PrizeType
  Int_AutomatedDraw: number
  VC_Description: string
  Int_PrizeValuePercent: number
  Dec_Value: number
  Dt_DrawISO: string
}

const statusMap: Record<number, { label: string; color: string }> = {
  1: { label: 'Not Drawn', color: 'zinc' },
  2: { label: 'Winner Drawn', color: 'lime' },
  3: { label: 'Paid Out', color: 'emerald' },
  4: { label: 'Unclaimed', color: 'amber' },
  5: { label: 'Donated', color: 'cyan' },
}

export function RaffleInfoTab({ raffle, prizes, buyIns, onUpdated }: Props) {
  const { data: session } = useSession()
  const access = Number((session as any)?.user?.charityAccess?.[0]?.Int_UserAccess ?? 3)
  const canControlByRole = access === 1 || access === 2
  const canEditByStatus = raffle?.Int_DrawStatus === 1
  const canEdit = canControlByRole && canEditByStatus

  const { markPaidOut, markDonated, loadingId, error } = usePrizeActions()
  const {
    updateDetails,
    updateRules,
    updatePrizeSafe,
    createPrizeSafe,
    updateBuyIn,
    createBuyIn,
    deletePrizeSafe,
    deleteBuyIn,
  } = useRaffleInlineEdits()

  const [localError, setLocalError] = useState<string | null>(null)

  // Local mirrors
  const [rows, setRows] = useState<any[]>(prizes)
  const [bundles, setBundles] = useState<any[]>(buyIns)
  const [details, setDetails] = useState<string>(raffle?.Txt_GameDetails || '')
  const [rules, setRules] = useState<string>(raffle?.Txt_GameRules || '')

  useEffect(() => setRows(prizes), [prizes])
  useEffect(() => setBundles(buyIns), [buyIns])
  useEffect(() => setDetails(raffle?.Txt_GameDetails || ''), [raffle?.Txt_GameDetails])
  useEffect(() => setRules(raffle?.Txt_GameRules || ''), [raffle?.Txt_GameRules])

  // Editor dialog state (create/edit for prize or bundle)
  const [rowOpen, setRowOpen] = useState(false)
  const [rowType, setRowType] = useState<'prize' | 'bundle' | null>(null)
  const [rowId, setRowId] = useState<string | null>(null)
  const [savingRow, setSavingRow] = useState(false)
  const [prizeForm, setPrizeForm] = useState<PrizeFormState>({
    Int_Place: 1,
    Int_Prize_Type: PRIZE_TYPES.FIFTY_FIFTY_CASH as PrizeType,
    Int_AutomatedDraw: 1,
    VC_Description: '',
    Int_PrizeValuePercent: 0,
    Dec_Value: 0,
    Dt_DrawISO: '',
  })
  const [bundleForm, setBundleForm] = useState({
    Int_NumbTicket: 1,
    Dec_Price: 0,
    VC_Description: '',
  })

  // Sales windows (support legacy field names)
  const startISO = toLocalISO(raffle.Dt_SaleOpen || raffle.Dt_SalesOpen)
  const endISO = toLocalISO(raffle.Dt_SaleClose || raffle.Dt_SalesClose)
  const minDrawPicker = startISO || new Date().toISOString().slice(0, 16)

  const mainPrize = rows.find((p) => Number(p.Int_Place) === 1) || null

  function getMinDrawISOForPrize(place: number) {
    if (place === 1 && endISO) return endISO
    return minDrawPicker
  }
  function getMaxDrawISOForPrize(place: number) {
    if (place !== 1 && mainPrize?.Dt_Draw) return toLocalISO(mainPrize.Dt_Draw)
    return ''
  }
  function nextPlaceLocal(list: any[]) {
    const max = list.reduce((m, p) => Math.max(m, Number(p.Int_Place) || 0), 0)
    return Math.max(1, max + 1)
  }

  function openAddPrize() {
    const place = nextPlaceLocal(rows)
    setRowType('prize')
    setRowId(null)
    setPrizeForm({
      Int_Place: place,
      Int_Prize_Type: PRIZE_TYPES.PRIZE_RAFFLE as PrizeType,
      Int_AutomatedDraw: 1,
      VC_Description: '',
      Int_PrizeValuePercent: 0,
      Dec_Value: 0,
      Dt_DrawISO: '',
    })
    setRowOpen(true)
  }
  function openAddBundle() {
    setRowType('bundle')
    setRowId(null)
    setBundleForm({ Int_NumbTicket: 1, Dec_Price: 0, VC_Description: '' })
    setRowOpen(true)
  }

  function openPrizeEditor(p: any) {
    const type = Number(p.Int_Prize_Type ?? PRIZE_TYPES.FIFTY_FIFTY_CASH) as PrizeType
    const vc = (p.VC_Description ?? '').trim()
    const desc = type === PRIZE_TYPES.FIFTY_FIFTY_CASH && !vc ? '50% of Total Jackpot' : (p.VC_Description ?? '')

    setRowType('prize')
    setRowId(p.Guid_PrizeId)
    setPrizeForm({
      Int_Place: Number(p.Int_Place ?? 1),
      Int_Prize_Type: type,
      Int_AutomatedDraw: Number(p.Int_AutomatedDraw ?? 1),
      VC_Description: desc,
      Int_PrizeValuePercent: Number(p.Int_PrizeValuePercent ?? 0),
      Dec_Value: Number(p.Dec_Value ?? 0),
      Dt_DrawISO: toLocalISO(p.Dt_Draw),
    })
    setRowOpen(true)
  }
  function openBundleEditor(b: any) {
    setRowType('bundle')
    setRowId(b.Guid_BuyIn)
    setBundleForm({
      Int_NumbTicket: Math.max(1, Number(b.Int_NumbTicket ?? 1)),
      Dec_Price: Math.max(0, Number(b.Dec_Price ?? 0)),
      VC_Description: b.VC_Description ?? '',
    })
    setRowOpen(true)
  }

  function formatBundleDesc(tickets: number, price: number) {
    if (!tickets || price < 0) return ''
    const ticketLabel = tickets === 1 ? 'ticket' : 'tickets'
    return `${tickets} ${ticketLabel} for $${price}`
  }

  // Delete confirmation
  const [delOpen, setDelOpen] = useState(false)
  const [delType, setDelType] = useState<'prize' | 'bundle' | null>(null)
  const [delId, setDelId] = useState<string | null>(null)
  const [delLabel, setDelLabel] = useState<string>('')
  const [deleting, setDeleting] = useState(false)

  function askDeletePrize(p: any) {
    if (!canEdit) return
    if (Number(p.Int_Place) === 1) {
      setLocalError('The prize with Int_Place 1 cannot be deleted.')
      return
    }
    setDelType('prize')
    setDelId(p.Guid_PrizeId)
    setDelLabel(p.VC_Description || 'this prize')
    setDelOpen(true)
  }
  function askDeleteBundle(b: any) {
    if (!canEdit) return
    setDelType('bundle')
    setDelId(b.Guid_BuyIn)
    setDelLabel(b.VC_Description || 'this bundle')
    setDelOpen(true)
  }
  async function confirmDelete() {
    if (!delOpen || !delType || !delId) return
    setDeleting(true)
    try {
      if (delType === 'prize') {
        await deletePrizeSafe(delId, { prizes: rows })
        setRows((prev) => prev.filter((p) => p.Guid_PrizeId !== delId))
      } else {
        await deleteBuyIn(delId)
        setBundles((prev) => prev.filter((b) => b.Guid_BuyIn !== delId))
      }
      setDelOpen(false)
      setDelId(null)
      setDelType(null)
      setDelLabel('')
      onUpdated?.()
    } catch (e: any) {
      setLocalError(e?.message || 'Delete failed.')
    } finally {
      setDeleting(false)
    }
  }

  // Client-side validations for the modal
  const prizeValid =
    rowType !== 'prize' ||
    (() => {
      const hasDesc = !!prizeForm.VC_Description.trim()
      const is50 = prizeForm.Int_Prize_Type === PRIZE_TYPES.FIFTY_FIFTY_CASH
      const amountOk = is50 ? true : prizeForm.Dec_Value > 0
      const dt = prizeForm.Dt_DrawISO ? new Date(prizeForm.Dt_DrawISO) : null
      const minISO = getMinDrawISOForPrize(prizeForm.Int_Place)
      const maxISO = getMaxDrawISOForPrize(prizeForm.Int_Place)
      const afterMin = dt ? dt.getTime() >= new Date(minISO).getTime() : true
      const beforeMax = dt && maxISO ? dt.getTime() < new Date(maxISO).getTime() : true

      const typeOk =
        prizeForm.Int_Place === 1
          ? prizeForm.Int_Prize_Type === PRIZE_TYPES.FIFTY_FIFTY_CASH ||
            prizeForm.Int_Prize_Type === PRIZE_TYPES.PRIZE_RAFFLE
          : prizeForm.Int_Prize_Type === PRIZE_TYPES.PRIZE_RAFFLE || prizeForm.Int_Prize_Type === PRIZE_TYPES.EARLY_BIRD

      return hasDesc && amountOk && typeOk && afterMin && beforeMax
    })()

  const bundleValid =
    rowType !== 'bundle' ||
    (bundleForm.Int_NumbTicket >= 1 &&
      Number.isFinite(bundleForm.Dec_Price) &&
      bundleForm.Dec_Price >= 0 &&
      String(bundleForm.VC_Description).trim())

  // Create/Edit save handler (normalizes server response for immediate UI)
  async function saveRow() {
    if (!rowOpen || !rowType) return
    if ((rowType === 'prize' && !prizeValid) || (rowType === 'bundle' && !bundleValid)) {
      setLocalError('Please fix validation errors.')
      return
    }
    setSavingRow(true)
    try {
      if (rowType === 'prize') {
        const payload = {
          Int_Place: Number(prizeForm.Int_Place),
          Int_Prize_Type: Number(prizeForm.Int_Prize_Type),
          Int_AutomatedDraw: 1,
          VC_Description: prizeForm.VC_Description.trim(),
          Int_PrizeValuePercent: Number(prizeForm.Int_PrizeValuePercent),
          Dec_Value: Number(prizeForm.Dec_Value),
          Dt_Draw: prizeForm.Dt_DrawISO ? toServerDT(prizeForm.Dt_DrawISO) : '',
        }

        if (rowId) {
          await updatePrizeSafe(rowId, payload, {
            raffle: {
              Dt_SaleOpen: raffle.Dt_SaleOpen || raffle.Dt_SalesOpen,
              Dt_SaleClose: raffle.Dt_SaleClose || raffle.Dt_SalesClose,
            },
            prizes: rows,
          })
          setRows((prev) =>
            prev.map((p) =>
              p.Guid_PrizeId === rowId ? { ...p, ...payload, Dt_Draw: payload.Dt_Draw || p.Dt_Draw } : p
            )
          )
        } else {
          const created = await createPrizeSafe(
            raffle.Guid_RaffleId,
            {
              Int_Place: prizeForm.Int_Place,
              Int_Prize_Type: payload.Int_Prize_Type as any,
              Int_AutomatedDraw: 1,
              VC_Description: payload.VC_Description,
              Int_PrizeValuePercent: payload.Int_PrizeValuePercent,
              Dec_Value: payload.Dec_Value,
              Dt_Draw: payload.Dt_Draw,
            },
            {
              raffle: {
                Dt_SaleOpen: raffle.Dt_SaleOpen || raffle.Dt_SalesOpen,
                Dt_SaleClose: raffle.Dt_SaleClose || raffle.Dt_SalesClose,
              },
              prizes: rows,
            }
          )

          const clientPrize = {
            Guid_PrizeId: created.Guid_PrizeId,
            Int_Place: Number(created.Int_Place ?? prizeForm.Int_Place),
            Int_Prize_Type: Number(created.Int_Prize_Type ?? payload.Int_Prize_Type),
            Int_AutomatedDraw: Number(created.Int_AutomatedDraw ?? 1),
            VC_Description: created.VC_Description ?? payload.VC_Description,
            Int_PrizeValuePercent: Number(created.Int_PrizeValuePercent ?? payload.Int_PrizeValuePercent ?? 0),
            Dec_Value: Number(created.Dec_Value ?? payload.Dec_Value ?? 0),
            Dt_Draw: created.Dt_Draw ?? payload.Dt_Draw ?? '',
            Int_Prize_Status: Number(created.Int_Prize_Status ?? 1),
            VC_Note: created.VC_Note ?? '',
            Guid_TicketId: created.Guid_TicketId ?? null,
          }

          setRows((prev) => [...prev, clientPrize].sort((a, b) => Number(a.Int_Place) - Number(b.Int_Place)))
        }
      } else {
        if (rowId) {
          await updateBuyIn(rowId, {
            Int_NumbTicket: Number(bundleForm.Int_NumbTicket),
            Dec_Price: Number(bundleForm.Dec_Price),
            VC_Description: bundleForm.VC_Description.trim(),
          })
          setBundles((prev) =>
            prev.map((b) =>
              b.Guid_BuyIn === rowId
                ? {
                    ...b,
                    Int_NumbTicket: bundleForm.Int_NumbTicket,
                    Dec_Price: bundleForm.Dec_Price,
                    VC_Description: bundleForm.VC_Description,
                  }
                : b
            )
          )
        } else {
          const created = await createBuyIn(raffle.Guid_RaffleId, {
            Int_NumbTicket: Number(bundleForm.Int_NumbTicket),
            Dec_Price: Number(bundleForm.Dec_Price),
            VC_Description: bundleForm.VC_Description.trim(),
          })

          const clientBuyIn = {
            Guid_BuyIn: created.Guid_BuyIn,
            Int_NumbTicket: Number(created.Int_NumbTicket ?? bundleForm.Int_NumbTicket),
            Dec_Price: Number(created.Dec_Price ?? bundleForm.Dec_Price),
            VC_Description: created.VC_Description ?? bundleForm.VC_Description,
          }

          setBundles((prev) => [...prev, clientBuyIn])
        }
      }

      setRowOpen(false)
      setLocalError(null)
      alert('Saved.')
      onUpdated?.()
    } catch (e: any) {
      setLocalError(e?.message || 'Failed to save.')
    } finally {
      setSavingRow(false)
    }
  }

  // Details / Rules editor
  const [textOpen, setTextOpen] = useState(false)
  const [textKind, setTextKind] = useState<'details' | 'rules' | null>(null)
  const [textVal, setTextVal] = useState('') // HTML string
  const [savingText, setSavingText] = useState(false)

  function openText(kind: 'details' | 'rules') {
    setTextKind(kind)
    setTextVal(kind === 'details' ? details : rules)
    setTextOpen(true)
  }
  async function saveText() {
    if (!textKind) return
    if (!textVal || !textVal.trim()) {
      setLocalError('Text cannot be empty.')
      return
    }
    setSavingText(true)
    try {
      if (textKind === 'details') {
        await updateDetails(raffle.Guid_RaffleId, textVal)
        setDetails(textVal)
      } else {
        await updateRules(raffle.Guid_RaffleId, textVal)
        setRules(textVal)
      }
      setTextOpen(false)
      setLocalError(null)
      alert('Saved.')
      onUpdated?.()
    } catch (e: any) {
      setLocalError(e?.message || 'Failed to save text.')
    } finally {
      setSavingText(false)
    }
  }

  // Paid/Donated note dialog
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
    if (action === 'paid') ok = await markPaidOut(prizeId!, trimmed)
    if (action === 'donate') ok = await markDonated(prizeId!, trimmed)
    if (!ok) {
      setLocalError('Failed to update status.')
      return
    }
    setRows((prev) =>
      prev.map((p) => (p.Guid_PrizeId === prizeId ? { ...p, Int_Prize_Status: action === 'paid' ? 3 : 5 } : p))
    )
    setLocalError(null)
    resetDialog()
    onUpdated?.()
  }

  const renderActionButton = (prize: any) => {
    if (!canControlByRole) return null
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
    <div className="mt-5 space-y-8 text-sm text-zinc-700 dark:text-zinc-200">
      {!!(error || localError) && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          {localError || error}
        </div>
      )}

      {/* Game Details */}
      <section>
        <div className="flex items-center justify-between">
          <h3 className="text-base/7 font-semibold text-zinc-900 dark:text-zinc-100">Game Details</h3>
          {canEdit && (
            <button
              onClick={() => openText('details')}
              className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 hover:underline dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              <PencilSquareIcon className="size-4" /> Edit
            </button>
          )}
        </div>
        <div className="prose prose-sm mt-2 max-w-none text-zinc-800 dark:text-zinc-100 dark:prose-invert prose-headings:text-zinc-900 dark:prose-headings:text-zinc-100">
          <ShowMore lines={3}>
            <div dangerouslySetInnerHTML={{ __html: details || 'No game details available.' }} />
          </ShowMore>
        </div>
      </section>

      {/* Game Rules */}
      <section>
        <div className="flex items-center justify-between">
          <h3 className="text-base/7 font-semibold text-zinc-900 dark:text-zinc-100">Game Rules</h3>
          {canEdit && (
            <button
              onClick={() => openText('rules')}
              className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 hover:underline dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              <PencilSquareIcon className="size-4" /> Edit
            </button>
          )}
        </div>
        <div className="prose prose-sm mt-2 max-w-none text-zinc-800 dark:text-zinc-100 dark:prose-invert prose-headings:text-zinc-900 dark:prose-headings:text-zinc-100">
          <ShowMore lines={3}>
            <div dangerouslySetInnerHTML={{ __html: rules || 'No game rules available.' }} />
          </ShowMore>
        </div>
      </section>

      {/* Prizes */}
      <section>
        <div className="flex items-center justify-between">
          <h3 className="text-base/7 font-semibold text-zinc-900 dark:text-zinc-100">Prize Details</h3>
          {canEdit && (
            <button
              className="text-xs text-indigo-600 hover:text-indigo-700 hover:underline dark:text-indigo-400 dark:hover:text-indigo-300"
              onClick={openAddPrize}
            >
              + Add Prize
            </button>
          )}
        </div>
        <div className="mt-2">
          <p>
            <b className="text-zinc-900 dark:text-zinc-100">Prize Claim Period:</b> {raffle.Int_UnClaimedTimeOut} days
          </p>
        </div>

        <div className="mt-3 overflow-x-auto rounded-md border border-zinc-200 dark:border-zinc-700">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
            <thead className="bg-zinc-50 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Description</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Value</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Draw Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Winner</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                {canEdit && <th className="px-4 py-3 text-left text-sm font-semibold"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-900">
              {rows.map((prize) => {
                const { label, color } = statusMap[prize.Int_Prize_Status] || { label: 'Unknown', color: 'zinc' }
                return (
                  <tr key={prize.Guid_PrizeId}>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span>{prize.VC_Description}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {Number(prize.Int_Prize_Type) === PRIZE_TYPES.FIFTY_FIFTY_CASH
                        ? '50% of total jackpot'
                        : `$${Number(prize.Dec_Value ?? 0).toFixed(2)}`}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {prize.Dt_Draw && prize.Dt_Draw !== '0000-00-00 00:00:00'
                        ? format(new Date(prize.Dt_Draw), 'MMMM d, yyyy h:mm a')
                        : 'TBD'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {prize.VC_Note && (
                        <span className="mr-2 inline-block max-w-[24ch] truncate align-middle text-zinc-500 dark:text-zinc-400">
                          {prize.VC_Note}
                        </span>
                      )}
                      <Badge color={color as any}>{label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {!prize.Guid_TicketId || prize.Guid_TicketId === 'null'
                        ? 'No Winner Selected'
                        : prize.Guid_TicketId}
                    </td>
                    <td className="px-4 py-3 text-sm">{renderActionButton(prize)}</td>
                    <td className="px-4 py-3 text-sm">
                      {canEdit && (
                        <div className="flex items-center gap-2">
                          <button
                            className="text-xs text-indigo-600 hover:text-indigo-700 hover:underline dark:text-indigo-400 dark:hover:text-indigo-300"
                            onClick={() => openPrizeEditor(prize)}
                          >
                            Edit
                          </button>
                          <span className="text-zinc-300 dark:text-zinc-600">|</span>
                          <button
                            className="text-xs text-red-600 hover:text-red-700 hover:underline dark:text-red-400 dark:hover:text-red-300"
                            onClick={() => askDeletePrize(prize)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bundles */}
      <section>
        <div className="flex items-center justify-between">
          <h3 className="text-base/7 font-semibold text-zinc-900 dark:text-zinc-100">Ticket Bundles</h3>
          {canEdit && (
            <button
              className="text-xs text-indigo-600 hover:text-indigo-700 hover:underline dark:text-indigo-400 dark:hover:text-indigo-300"
              onClick={openAddBundle}
            >
              + Add Ticket Bundle
            </button>
          )}
        </div>
        <div className="mt-2 overflow-x-auto rounded-md border border-zinc-200 dark:border-zinc-700">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
            <thead className="bg-zinc-50 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Description</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Number of Tickets</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Price</th>
                {canEdit && <th className="px-4 py-3 text-left text-sm font-semibold"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-900">
              {bundles.map((b) => (
                <tr key={b.Guid_BuyIn}>
                  <td className="px-4 py-3 text-sm">{b.VC_Description}</td>
                  <td className="px-4 py-3 text-sm">{b.Int_NumbTicket}</td>
                  <td className="px-4 py-3 text-sm">${Number(b.Dec_Price ?? 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm">
                    {canEdit && (
                      <div className="flex items-center gap-2">
                        <button
                          className="text-xs text-indigo-600 hover:text-indigo-700 hover:underline dark:text-indigo-400 dark:hover:text-indigo-300"
                          onClick={() => openBundleEditor(b)}
                        >
                          Edit
                        </button>
                        <span className="text-zinc-300 dark:text-zinc-600">|</span>
                        <button
                          className="text-xs text-red-600 hover:text-red-700 hover:underline dark:text-red-400 dark:hover:text-red-300"
                          onClick={() => askDeleteBundle(b)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Prize / Bundle Editor */}
      <Dialog open={rowOpen} onClose={() => setRowOpen(false)} size="md" aria-label="Edit row">
        <DialogTitle className="text-zinc-900 dark:text-zinc-100">
          {rowType === 'prize'
            ? rowId
              ? 'Edit Prize'
              : 'Add Prize'
            : rowId
              ? 'Edit Ticket Bundle'
              : 'Add Ticket Bundle'}
        </DialogTitle>
        <DialogBody>
          {/* Keep WebKit fallback, but use color-scheme for proper dark icons across browsers */}
          <style jsx global>{`
            .dark input[type='date']::-webkit-calendar-picker-indicator,
            .dark input[type='time']::-webkit-calendar-picker-indicator,
            .dark input[type='datetime-local']::-webkit-calendar-picker-indicator {
              filter: invert(1) opacity(0.9);
            }
          `}</style>

          {rowType === 'prize' ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-sm">
                Prize Type
                <select
                  className="w-full rounded-md border border-zinc-300 bg-white p-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  value={prizeForm.Int_Prize_Type}
                  onChange={(e) => {
                    const nextType = Number(e.target.value) as PrizeType
                    const nextDesc =
                      nextType === PRIZE_TYPES.FIFTY_FIFTY_CASH && !prizeForm.VC_Description.trim()
                        ? '50% of Total Jackpot'
                        : prizeForm.VC_Description
                    setPrizeForm({ ...prizeForm, Int_Prize_Type: nextType, VC_Description: nextDesc })
                  }}
                  required
                >
                  {prizeForm.Int_Place === 1 ? (
                    <>
                      <option value={PRIZE_TYPES.FIFTY_FIFTY_CASH}>50/50 Cash Prize</option>
                      <option value={PRIZE_TYPES.PRIZE_RAFFLE}>Prize Raffle</option>
                    </>
                  ) : (
                    <>
                      <option value={PRIZE_TYPES.PRIZE_RAFFLE}>Prize Raffle</option>
                      <option value={PRIZE_TYPES.EARLY_BIRD}>Earlybird Raffle</option>
                    </>
                  )}
                </select>
              </label>

              <label className="text-sm sm:col-span-2">
                Description
                <input
                  className="w-full rounded-md border border-zinc-300 bg-white p-2 text-zinc-900 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
                  value={prizeForm.VC_Description}
                  onChange={(e) => setPrizeForm({ ...prizeForm, VC_Description: e.target.value })}
                  required
                />
                {!prizeForm.VC_Description.trim() && <p className="mt-1 text-xs text-red-600">Required</p>}
              </label>

              {prizeForm.Int_Prize_Type === PRIZE_TYPES.FIFTY_FIFTY_CASH ? (
                <div className="text-sm sm:col-span-2">
                  <div className="font-medium">Value</div>
                  <div className="mt-1 rounded-md border border-zinc-300 bg-zinc-50 p-2 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                    50% of total jackpot (auto)
                  </div>
                </div>
              ) : (
                <label className="text-sm">
                  Value
                  <input
                    type="number"
                    min={0.01}
                    step="0.01"
                    className="w-full rounded-md border border-zinc-300 bg-white p-2 text-zinc-900 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
                    value={prizeForm.Dec_Value}
                    onChange={(e) =>
                      setPrizeForm({ ...prizeForm, Dec_Value: Math.max(0, Number(e.target.value || 0)) })
                    }
                    required
                  />
                  {!(prizeForm.Dec_Value > 0) && <p className="mt-1 text-xs text-red-600">Enter a positive amount.</p>}
                </label>
              )}

              <label className="text-sm sm:col-span-2">
                Draw (date &amp; time)
                <input
                  type="datetime-local"
                  className="w-full rounded-md border border-zinc-300 bg-white p-2 text-zinc-900 placeholder-zinc-400 [color-scheme:light] outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 dark:[color-scheme:dark]"
                  value={prizeForm.Dt_DrawISO}
                  min={getMinDrawISOForPrize(prizeForm.Int_Place)}
                  max={getMaxDrawISOForPrize(prizeForm.Int_Place) || undefined}
                  onChange={(e) => setPrizeForm({ ...prizeForm, Dt_DrawISO: e.target.value })}
                />
                {prizeForm.Int_Place === 1 ? (
                  prizeForm.Dt_DrawISO &&
                  endISO &&
                  new Date(prizeForm.Dt_DrawISO) <= new Date(endISO) && (
                    <p className="mt-1 text-xs text-red-600">Main prize draw must be after sales end.</p>
                  )
                ) : (
                  <>
                    {prizeForm.Dt_DrawISO &&
                      new Date(prizeForm.Dt_DrawISO) < new Date(getMinDrawISOForPrize(prizeForm.Int_Place)) && (
                        <p className="mt-1 text-xs text-red-600">Draw must be on/after sales start.</p>
                      )}
                    {prizeForm.Dt_DrawISO &&
                      getMaxDrawISOForPrize(prizeForm.Int_Place) &&
                      new Date(prizeForm.Dt_DrawISO) >= new Date(getMaxDrawISOForPrize(prizeForm.Int_Place)!) && (
                        <p className="mt-1 text-xs text-red-600">Draw must be before the main prize draw.</p>
                      )}
                  </>
                )}
              </label>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-sm">
                Tickets
                <input
                  type="number"
                  min={1}
                  className="w-full rounded-md border border-zinc-300 bg-white p-2 text-zinc-900 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
                  value={bundleForm.Int_NumbTicket}
                  onChange={(e) => {
                    const t = Math.max(1, Number(e.target.value || 1))
                    const desc = formatBundleDesc(t, Number(bundleForm.Dec_Price))
                    setBundleForm({ ...bundleForm, Int_NumbTicket: t, VC_Description: desc })
                  }}
                  required
                />
              </label>

              <label className="text-sm">
                Price
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className="w-full rounded-md border border-zinc-300 bg-white p-2 text-zinc-900 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
                  value={bundleForm.Dec_Price}
                  onChange={(e) => {
                    const p = Math.max(0, Number(e.target.value || 0))
                    const desc = formatBundleDesc(Number(bundleForm.Int_NumbTicket), p)
                    setBundleForm({ ...bundleForm, Dec_Price: p, VC_Description: desc })
                  }}
                  required
                />
              </label>

              <label className="text-sm sm:col-span-2">
                Description
                <input
                  className="w-full rounded-md border border-zinc-300 bg-white p-2 text-zinc-900 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
                  value={bundleForm.VC_Description}
                  onChange={(e) => setBundleForm({ ...bundleForm, VC_Description: e.target.value })}
                  required
                />
                {!bundleForm.VC_Description.trim() && <p className="mt-1 text-xs text-red-600">Required</p>}
              </label>
            </div>
          )}
        </DialogBody>
        <DialogActions>
          <button
            type="button"
            onClick={() => setRowOpen(false)}
            className="rounded-md border px-3 py-1.5 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={saveRow}
            disabled={savingRow || (rowType === 'prize' && !prizeValid) || (rowType === 'bundle' && !bundleValid)}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {savingRow ? 'Saving…' : rowId ? 'Save' : 'Create'}
          </button>
        </DialogActions>
      </Dialog>

      {/* Details/Rules dialog */}
      <Dialog open={textOpen} onClose={() => setTextOpen(false)} size="lg" aria-label="Edit text">
        <DialogTitle className="text-zinc-900 dark:text-zinc-100">
          {textKind === 'details' ? 'Edit Game Details' : 'Edit Game Rules'}
        </DialogTitle>
        <DialogDescription className="text-zinc-600 dark:text-zinc-300">
          HTML supported. Use the editor below.
        </DialogDescription>
        <DialogBody>
          <RichTextEditorTiptap value={textVal} onChange={setTextVal} placeholder="Write here..." />
          {!textVal.trim() && <p className="mt-1 text-xs text-red-600">Content cannot be empty.</p>}
        </DialogBody>
        <DialogActions>
          <button
            type="button"
            onClick={() => setTextOpen(false)}
            className="rounded-md border px-3 py-1.5 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={saveText}
            disabled={savingText || !textVal.trim()}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {savingText ? 'Saving…' : 'Save'}
          </button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={delOpen} onClose={() => setDelOpen(false)} size="sm" aria-label="Confirm delete">
        <DialogTitle className="text-zinc-900 dark:text-zinc-100">
          Delete {delType === 'prize' ? 'Prize' : 'Ticket Bundle'}
        </DialogTitle>
        <DialogDescription className="text-zinc-600 dark:text-zinc-300">
          Are you sure you want to permanently delete <b>{delLabel}</b>? This action cannot be undone.
        </DialogDescription>
        <DialogBody>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Deletions are only allowed before the raffle starts (status “Not Started”).
          </p>
        </DialogBody>
        <DialogActions>
          <button
            type="button"
            onClick={() => setDelOpen(false)}
            className="rounded-md border px-3 py-1.5 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmDelete}
            disabled={deleting}
            className="rounded-md bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-700 disabled:opacity-60"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </DialogActions>
      </Dialog>

      {/* Paid/Donated dialog */}
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
            <span className="text-zinc-400 dark:text-zinc-500">
              {note.length}/{NOTE_MAX}
            </span>
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
