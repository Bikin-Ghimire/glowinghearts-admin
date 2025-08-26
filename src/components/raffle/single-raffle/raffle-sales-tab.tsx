// components/Raffle/RaffleSalesTab.tsx
'use client'

import { usePurchaseDetails } from '@/hooks/use-purchase-details'
import type { PackageItem } from '@/lib/purchases'
import {
  EnvelopeIcon,
  PhoneIcon,
  UserIcon,
  MapPinIcon,
  HomeIcon,
  GlobeAltIcon,
  ComputerDesktopIcon,
  CheckCircleIcon,
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

type Purchase = {
  Guid_PurchaseId: string
  Int_TotalTickets: number
  Dec_TotalPrice: number
  Dt_Purchased: string
  obj_Packages: PackageItem[]
}

type Props = {
  purchases: Purchase[]
  raffleId: string
}

const columnHelper = createColumnHelper<Purchase>()

export function RaffleSalesTab({ purchases, raffleId }: Props) {
  const [expanded, setExpanded] = useState<import('@tanstack/react-table').ExpandedState>({})
  const { get, refresh, peek, status, error } = usePurchaseDetails()

  const [refundOpen, setRefundOpen] = useState(false)
  const [activePurchaseId, setActivePurchaseId] = useState<string | null>(null)

  const columns: ColumnDef<Purchase, any>[] = [
    columnHelper.accessor('Guid_PurchaseId', {
      header: 'Purchase ID',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('Dec_TotalPrice', {
      header: 'Amount Paid',
      cell: (info) => {
        const val = Number(info.getValue())
        return isNaN(val) ? info.getValue() : `$${val.toFixed(2)}`
      },
    }),
    columnHelper.accessor('Int_TotalTickets', {
      header: 'Tickets Purchased',
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
    data: purchases,
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
    // lazily fetch details (cached in the hook)
    void get(purchaseId)
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

  return (
    <>
      <div className="overflow-x-auto rounded border border-zinc-200 shadow-sm dark:border-zinc-700">
        <table className="min-w-[1200px] text-left text-sm text-zinc-900 dark:text-zinc-100">
          {/* Header */}
          <thead className="sticky top-0 z-10 bg-zinc-50/95 backdrop-blur dark:bg-zinc-900/80">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-zinc-200 dark:border-zinc-700">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 font-semibold whitespace-nowrap text-zinc-900 dark:text-zinc-50"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          {/* Body */}
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
                    className="cursor-pointer focus-within:bg-zinc-50 hover:bg-zinc-50 dark:focus-within:bg-zinc-800/70 dark:hover:bg-zinc-800/70"
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
                                </div>
                              </div>

                              {/* Address & Meta */}
                              <div className="mt-3 grid gap-2 md:grid-cols-2">
                                <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/60">
                                  <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                                    <HomeIcon className="h-3.5 w-3.5" />
                                    Address
                                  </div>
                                  <div className="text-xs text-zinc-700 dark:text-zinc-200">
                                    <div>{det.VC_PlayerAddr1 || '—'}</div>
                                    {det.VC_PlayerAddr2 ? <div>{det.VC_PlayerAddr2}</div> : null}
                                    <div>
                                      {(det.VC_PlayerCity || '—')}{' '}
                                      {det.VC_PlayerProvince ? `, ${det.VC_PlayerProvince}` : ''}{' '}
                                      {det.VC_PlayerPostalCode ? ` ${det.VC_PlayerPostalCode}` : ''}
                                    </div>
                                  </div>
                                </div>

                                <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/60">
                                  <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
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

                              {/* Actions */}
                              <div className="mt-3 flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  className="inline-flex items-center rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm ring-1 ring-red-700/40 ring-inset hover:bg-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 dark:ring-red-900/60"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setActivePurchaseId(pid)
                                    setRefundOpen(true)
                                  }}
                                  aria-label="Refund this purchase"
                                >
                                  Refund
                                </button>

                                <button
                                  type="button"
                                  className="inline-flex items-center rounded-md border border-amber-500 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 shadow-sm hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 dark:border-amber-600 dark:bg-amber-900/20 dark:text-amber-200 dark:hover:bg-amber-900/30"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    // TODO: call your future voidTickets() service here
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
                                    className="inline-block rounded border border-zinc-200 bg-white px-2 py-1 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
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
            await refresh(activePurchaseId) // re-fetch details for this row
          }
        }}
      />
    </>
  )
}