// components/Raffle/RaffleSalesTab.tsx
'use client'

import { usePurchaseDetails } from '@/hooks/use-purchase-details'
import type { PackageItem } from '@/lib/purchases'
import {
  CheckCircleIcon,
  ComputerDesktopIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  HomeIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
  XCircleIcon,
} from '@heroicons/react/16/solid'
import {
  ColumnDef,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { format } from 'date-fns'
import React, { useMemo, useState } from 'react'
import RefundDialog from './refund-dialog'
import { parseISO, startOfDay, endOfDay } from 'date-fns'
import { on } from 'events'
import { set } from 'zod'

type Purchase = {
  Guid_PurchaseId: string
  Int_TotalTickets: number
  Dec_TotalPrice: number
  Dt_Purchased: string
  obj_Packages: PackageItem[]
  Guid_RefundId?: string | null
  Dec_RefundAmount?: number | null
  Dt_Credit?: string | null
}

type Props = {
  purchases: Purchase[]
  raffleId: string
  onDataChanged?: () => Promise<void>
}

// Robust date parser for 'YYYY-MM-DD HH:mm:ss' or ISO
function toDateSafe(s: string | null | undefined): Date | null {
  if (!s) return null
  const isoish = s.includes('T') ? s : s.replace(' ', 'T') + (s.endsWith('Z') ? '' : 'Z')
  const d = new Date(isoish)
  return isNaN(d.getTime()) ? null : d
}

const columnHelper = createColumnHelper<Purchase>()

function isRefunded(d?: { Guid_RefundId?: string | null }) {
  return !!(d?.Guid_RefundId && d.Guid_RefundId !== '00000000-0000-0000-0000-000000000000')
}

function formatMoney(n?: number | null) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return ''
  return `$${Number(n).toFixed(2)}`
}

export function RaffleSalesTab({ purchases, raffleId, onDataChanged }: Props) {
  const [expanded, setExpanded] = useState<import('@tanstack/react-table').ExpandedState>({})
  const { get, refresh, peek, status, error } = usePurchaseDetails()

  const [refundOpen, setRefundOpen] = useState(false)
  const [activePurchaseId, setActivePurchaseId] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [exportErr, setExportErr] = useState<string | null>(null)

  const [searchId, setSearchId] = useState('')
  const [from, setFrom] = useState<string>('')
  const [to, setTo] = useState<string>('')

  // filter source rows instantly (client-side)
  const filtered = useMemo(() => {
    const q = searchId.trim().toLowerCase()
    const fromDate = from ? startOfDay(parseISO(from)) : null
    const toDate = to ? endOfDay(parseISO(to)) : null

    return purchases.filter(p => {
      if (q && !p.Guid_PurchaseId.toLowerCase().includes(q)) return false
      if (fromDate || toDate) {
        const d = toDateSafe(p.Dt_Purchased)
        if (!d) return false
        if (fromDate && d < fromDate) return false
        if (toDate && d > toDate) return false
      }
      return true
    })
  }, [purchases, searchId, from, to])

  const columns: ColumnDef<Purchase, any>[] = [
    columnHelper.accessor('Guid_PurchaseId', {
      header: 'Purchase ID',
      cell: (info) => <span className="break-all whitespace-normal">{info.getValue()}</span>,
    }),
    columnHelper.accessor('Dec_TotalPrice', {
      header: 'Amount Paid',
      cell: (info) => {
        const val = Number(info.getValue())
        return <span className="whitespace-nowrap">{isNaN(val) ? info.getValue() : `$${val.toFixed(2)}`}</span>
      },
    }),
    columnHelper.accessor('Int_TotalTickets', {
      header: 'Tickets Purchased',
      cell: (info) => <span className="whitespace-nowrap">{info.getValue()}</span>,
    }),
    columnHelper.accessor('Dt_Purchased', {
      header: 'Purchase Date',
      cell: (info) =>
        info.getValue() && info.getValue() !== '0000-00-00 00:00:00'
          ? format(new Date(info.getValue()), 'MMMM d, yyyy, h:mm a')
          : 'TBD',
    }),
  ]

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    state: { expanded },
    onExpandedChange: (updater) => {
      const next = typeof updater === 'function' ? updater(expanded) : updater
      setExpanded(next)
    },
    getRowCanExpand: () => true,
  })

  function handleRowToggle(purchaseId: string, toggle: () => void) {
    toggle()
    void get(purchaseId) // lazily fetch details (cached)
  }

  const activeDetails = useMemo(() => (activePurchaseId ? peek(activePurchaseId) : null), [activePurchaseId, peek])

  function StatusPill({ ok, label }: { ok: boolean | number | undefined; label: string }) {
    const isOk = ok === 1 || ok === true
    return (
      <span
        className={[
          'inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-medium ring-1 ring-inset',
          isOk
            ? 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/15 dark:text-green-300 dark:ring-green-800/40'
            : 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/20 dark:text-red-300 dark:ring-red-900/40',
        ].join(' ')}
      >
        {isOk ? <CheckCircleIcon className="h-3.5 w-3.5" /> : <XCircleIcon className="h-3.5 w-3.5" />}
        {label}
      </span>
    )
  }

  // --- CSV helpers ---
  function csvEscape(v: unknown): string {
    if (v === null || v === undefined) return ''
    let s = String(v)
    if (s.includes('"')) s = s.replace(/"/g, '""')
    if (/[",\n]/.test(s)) s = `"${s}"`
    return s
  }

  function formatDateISO(dt?: string) {
    if (!dt || dt === '0000-00-00 00:00:00') return ''
    const d = new Date(dt)
    if (isNaN(d.getTime())) return dt
    return d.toISOString()
  }

  async function downloadCSV() {
    try {
      setExportErr(null)
      setExporting(true)

      // Ensure details are fetched for all purchases
      await Promise.allSettled(purchases.map((p) => get(p.Guid_PurchaseId)))

      const headers = [
        'Purchase ID',
        'Purchase Date (ISO)',
        'Amount Paid',
        'Tickets Purchased',
        'Buyer Name',
        'Buyer Email',
        'Buyer Phone',
        'Addr1',
        'Addr2',
        'City',
        'Province',
        'Postal Code',
        'Age Verified',
        'T&C Accepted',
        'Geo Location',
        'Purchase IP',
        'Bundles (desc)',
        'Tickets (all)',
        'Stripe Payment Intent',
      ]

      const rows = purchases.map((p) => {
        const d = peek(p.Guid_PurchaseId) ?? ({} as any)
        const bundles = (d?.obj_Packages ?? p.obj_Packages ?? []) as PackageItem[]
        const bundleDescs = bundles
          .map((b) => b?.VC_Description)
          .filter(Boolean)
          .join(' | ')
        const allTickets = bundles
          .flatMap((b) => b?.obj_Tickets ?? [])
          .filter(Boolean)
          .join(' ')

        const amount = isNaN(Number(p.Dec_TotalPrice)) ? p.Dec_TotalPrice : Number(p.Dec_TotalPrice).toFixed(2)

        const vals = [
          p.Guid_PurchaseId,
          formatDateISO(p.Dt_Purchased),
          amount,
          p.Int_TotalTickets,
          d?.VC_PlayerFullName ?? '',
          d?.VC_PlayerEmail ?? '',
          d?.VC_PlayerPhone ?? '',
          d?.VC_PlayerAddr1 ?? '',
          d?.VC_PlayerAddr2 ?? '',
          d?.VC_PlayerCity ?? '',
          d?.VC_PlayerProvince ?? '',
          d?.VC_PlayerPostalCode ?? '',
          d?.Int_AgeVerified === 1 ? 'Yes' : d?.Int_AgeVerified === 0 ? 'No' : '',
          d?.Int_TC_Confirmed === 1 ? 'Yes' : d?.Int_TC_Confirmed === 0 ? 'No' : '',
          d?.VC_GeoLocation ?? '',
          d?.VC_PurchaseIP ?? '',
          bundleDescs,
          allTickets,
          d?.Guid_IntentId ?? '',
        ]
        return vals.map(csvEscape).join(',')
      })

      const csv = [headers.map(csvEscape).join(','), ...rows].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const date = new Date().toISOString().slice(0, 10)
      a.href = url
      a.download = `raffle-${raffleId}-sales-${date}.csv`
      document.body.appendChild(a)
      a.click()
      URL.revokeObjectURL(url)
      a.remove()
    } catch (e: any) {
      setExportErr(e?.message || 'Failed to export CSV')
      // (optional) you can also console.error(e)
    } finally {
      setExporting(false)
    }
  }



async function waitForWebhookThenRefresh(purchaseId: string) {
  const timeoutAt = Date.now() + 10_000
  while (Date.now() < timeoutAt) {
    const d = await refresh(purchaseId)
    if (d && d.Guid_RefundId && d.Guid_RefundId !== '00000000-0000-0000-0000-000000000000') {
      return d
    }
  }
}

  return (
    <>
      {/* Top bar: CSV export button */}
      <div className="mb-3 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Sales</div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          {exportErr && (
            <span className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
              {exportErr}
            </span>
          )}

          <label className="flex flex-col text-xs">
            <span className="mb-1 text-zinc-600 dark:text-zinc-300">Search by Purchase ID</span>
            <input
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="GUID / cs_ / pi_"
              className="w-[26rem] rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm outline-none
                         focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <div className="flex gap-2">
            <label className="flex flex-col text-xs">
              <span className="mb-1 text-zinc-600 dark:text-zinc-300">From</span>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm outline-none
                           focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>
            <label className="flex flex-col text-xs">
              <span className="mb-1 text-zinc-600 dark:text-zinc-300">To</span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm outline-none
                           focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={downloadCSV}
            disabled={exporting || filtered.length === 0}
            className={[
              'inline-flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm ring-1 ring-indigo-700/40 ring-inset',
              'hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300',
              'disabled:cursor-not-allowed disabled:opacity-60',
            ].join(' ')}
            aria-label="Download sales as CSV"
            title="Download sales as CSV"
          >
            {exporting ? 'Preparing CSV…' : 'Download CSV'}
          </button>
        </div>
      </div>

      <div className="rounded border border-zinc-200 shadow-sm dark:border-zinc-700">
        <table className="w-full table-auto text-left text-sm text-zinc-900 dark:text-zinc-100">
          <thead className="bg-zinc-50 dark:bg-zinc-900/80">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-zinc-200 dark:border-zinc-700">
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody className="divide-y divide-zinc-100 bg-white dark:divide-zinc-800 dark:bg-zinc-900">
            {table.getRowModel().rows.map((row) => {
              const pid = row.original.Guid_PurchaseId
              const det = peek(pid)
              const s = status(pid)
              const err = error(pid)
              const packagesToShow = (det?.obj_Packages?.length ? det.obj_Packages : row.original.obj_Packages) ?? []

              return (
                <React.Fragment key={row.id}>
                  <tr
                    className="cursor-pointer align-top focus-within:bg-zinc-50 hover:bg-zinc-50 dark:focus-within:bg-zinc-800/70 dark:hover:bg-zinc-800/70"
                    onClick={() => handleRowToggle(pid, row.toggleExpanded)}
                    aria-expanded={row.getIsExpanded()}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleRowToggle(pid, row.toggleExpanded)
                      }
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-2 align-top">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>

                  {row.getIsExpanded() && (
                    <tr className="border-t border-zinc-200 dark:border-zinc-700">
                      <td colSpan={columns.length} className="bg-zinc-50 px-6 py-4 dark:bg-zinc-900/60">
                        {/* Top: purchaser info + actions */}
                        <div className="mb-4">
                          {s === 'loading' && (
                            <div className="text-xs text-zinc-600 dark:text-zinc-300">Loading purchase details…</div>
                          )}

                          {s === 'error' && (
                            <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                              {err || 'Failed to load purchase details.'}
                            </div>
                          )}

                          {det && (
                            <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
                              <div className="mb-2 text-[10px] tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                                Purchaser
                              </div>

                              <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                                {/* Purchaser line */}
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
                                  <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                                    <UserIcon className="h-4 w-4 opacity-80" />
                                    <span className="font-medium">{det.VC_PlayerFullName || '—'}</span>
                                  </span>

                                  <a
                                    href={det.VC_PlayerEmail ? `mailto:${det.VC_PlayerEmail}` : undefined}
                                    onClick={(e) => !det.VC_PlayerEmail && e.preventDefault()}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-zinc-800 underline decoration-dotted underline-offset-2 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 dark:focus-visible:ring-indigo-600"
                                  >
                                    <EnvelopeIcon className="h-4 w-4 opacity-80" />
                                    {det.VC_PlayerEmail || '—'}
                                  </a>

                                  {det.VC_PlayerPhone && (
                                    <a
                                      href={`tel:${det.VC_PlayerPhone}`}
                                      className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-zinc-800 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 dark:focus-visible:ring-indigo-600"
                                    >
                                      <PhoneIcon className="h-4 w-4 opacity-80" />
                                      {det.VC_PlayerPhone}
                                    </a>
                                  )}
                                </div>

                                {/* Status pills */}
                                <div className="flex flex-wrap justify-start gap-2 md:justify-end">
                                  <StatusPill ok={det.Int_AgeVerified} label="Age Verified" />
                                  <StatusPill ok={det.Int_TC_Confirmed} label="T&C Accepted" />
                                  {isRefunded(det) && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2 py-1 text-[11px] font-medium text-zinc-700 ring-1 ring-red-300 ring-inset dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-700">
                                      Refunded
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Address & Meta */}
                              <div className="mt-3 grid gap-2 md:grid-cols-2">
                                <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/60">
                                  <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                                    <HomeIcon className="h-3.5 w-3.5" />
                                    Address
                                  </div>
                                  <div className="text-xs text-zinc-700 dark:text-zinc-200">
                                    <div>{det.VC_PlayerAddr1 || '—'}</div>
                                    {det.VC_PlayerAddr2 ? <div>{det.VC_PlayerAddr2}</div> : null}
                                    <div>
                                      {det.VC_PlayerCity || '—'}{' '}
                                      {det.VC_PlayerProvince ? `, ${det.VC_PlayerProvince}` : ''}{' '}
                                      {det.VC_PlayerPostalCode ? ` ${det.VC_PlayerPostalCode}` : ''}
                                    </div>
                                  </div>
                                </div>

                                <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/60">
                                  <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                                    <GlobeAltIcon className="h-3.5 w-3.5" />
                                    Location & Device
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-700 dark:text-zinc-200">
                                    <span className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900">
                                      <MapPinIcon className="h-4 w-4 opacity-80" />
                                      {det.VC_GeoLocation || '—'}
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900">
                                      <ComputerDesktopIcon className="h-4 w-4 opacity-80" />
                                      {det.VC_PurchaseIP || '—'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {det && isRefunded(det) && (
                                <div className="mt-3 rounded-lg border border-red-300/50 bg-red-50 p-3 text-sm text-red-900 dark:border-red-700/50 dark:bg-red-900/20 dark:text-red-200">
                                  <div className="font-semibold">Refund details</div>
                                  <div className="mt-1 grid gap-1 sm:grid-cols-2">
                                    <div>
                                      <span className="opacity-70">Refund ID:</span> {det.Guid_RefundId}
                                    </div>
                                    <div>
                                      <span className="opacity-70">Amount:</span> {formatMoney(det.Dec_RefundAmount)}
                                    </div>
                                    <div className="sm:col-span-2">
                                      <span className="opacity-70">Credited at:</span>{' '}
                                      {det.Dt_Credit ? format(new Date(det.Dt_Credit), 'MMMM d, yyyy, h:mm a') : '—'}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Actions */}
                              <div className="mt-3 flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  className={[
                                    'inline-flex items-center rounded-md px-3 py-1.5 text-xs font-semibold shadow-sm ring-1 ring-inset focus:outline-none',
                                    isRefunded(det)
                                      ? 'cursor-not-allowed border border-zinc-300 bg-zinc-100 text-zinc-500 ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700'
                                      : 'bg-red-600 text-white ring-red-700/40 hover:bg-red-500 focus-visible:ring-2 focus-visible:ring-red-300 dark:ring-red-900/60',
                                  ].join(' ')}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (isRefunded(det)) {
                                      alert('This purchase has already been refunded.') // swap with your toast if you have one
                                      return
                                    }
                                    setActivePurchaseId(pid)
                                    setRefundOpen(true)
                                  }}
                                  aria-label={isRefunded(det) ? 'Already refunded' : 'Refund this purchase'}
                                  disabled={isRefunded(det)}
                                  title={isRefunded(det) ? 'Already refunded' : undefined}
                                >
                                  Refund
                                </button>

                                <button
                                  type="button"
                                  className="inline-flex items-center rounded-md border border-amber-500 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 shadow-sm hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 dark:border-amber-600 dark:bg-amber-900/20 dark:text-amber-200 dark:hover:bg-amber-900/30"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    alert('Void Tickets API not yet implemented.')
                                  }}
                                  aria-label="Void tickets for this purchase"
                                >
                                  Void Tickets
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Bundles */}
                        <div className="space-y-4">
                          {packagesToShow.map((pkg, idx) => (
                            <div
                              key={idx}
                              className="rounded border border-zinc-200 p-4 dark:border-zinc-700 dark:bg-zinc-900"
                            >
                              <div className="mb-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                                {pkg.VC_Description}
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs text-zinc-600 md:grid-cols-3 lg:grid-cols-4 dark:text-zinc-300">
                                {pkg.obj_Tickets.map((ticket, i) => (
                                  <span
                                    key={i}
                                    className={[
                                      'inline-block rounded border border-zinc-200 bg-white px-2 py-1 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100',
                                      isRefunded(det) ? 'line-through opacity-60' : '',
                                    ].join(' ')}
                                  >
                                    {ticket}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Refund modal */}
      <RefundDialog
        open={refundOpen}
        onClose={() => setRefundOpen(false)}
        raffleId={raffleId}
        purchaseId={activePurchaseId}
        intentId={activePurchaseId ? peek(activePurchaseId)?.Guid_IntentId : undefined}
        totalAmount={activePurchaseId ? peek(activePurchaseId)?.Dec_TotalPrice : undefined}
        onSuccess={async () => {
          if (activePurchaseId) {
            await waitForWebhookThenRefresh(activePurchaseId)
          }
          await onDataChanged?.()
          setRefundOpen(false)
        }}
      />
    </>
  )
}
