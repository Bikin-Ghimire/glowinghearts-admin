// components/Raffle/RaffleChangeLogsTab.tsx
'use client'

import React, { useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
  ColumnDef,
  createColumnHelper,
} from '@tanstack/react-table'
import { format } from 'date-fns'

type Log = {
  VC_LicenseNumb: string
  VC_RaffleName: string
  VC_RaffleLocation: string
  Int_DrawStatus: number
  Dt_SalesOpen: string
  Dt_SalesClose: string
  Dt_CreateUpdate: string
  Txt_GameDetails: string
  Txt_GameRules: string
  User_Id: string
  VC_Admin_FirstName?: string | null
  VC_Admin_LastName?: string | null
}

type Props = {
  logs: Log[]
}

// Adjust to your codes
const DRAW_STATUS_LABELS: Record<number, string> = {
  1: 'Not Started',
  2: 'Active',
  3: 'Sales Complete',
  4: 'Draw Complete',
  5: 'Paid Out',
  6: 'On Hold',
}

const columnHelper = createColumnHelper<Log>()

export function RaffleChangeLogsTab({ logs }: Props) {
  const [exporting, setExporting] = useState(false)
  const [exportErr, setExportErr] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<import('@tanstack/react-table').ExpandedState>({})

  // Keep the table narrow: only core columns + "Details" label
  const columns: ColumnDef<Log, any>[] = [
    columnHelper.accessor('Dt_CreateUpdate', {
      header: 'Timestamp',
      cell: ({ getValue }) =>
        getValue() ? format(new Date(getValue()), 'yyyy-MM-dd HH:mm:ss') : '',
    }),
    columnHelper.accessor('VC_LicenseNumb', {
      header: 'License No',
      cell: ({ getValue }) => <span className="break-words">{getValue()}</span>,
    }),
    columnHelper.accessor('VC_RaffleName', {
      header: 'Raffle Name',
      cell: ({ getValue }) => <span className="break-words">{getValue()}</span>,
    }),
    columnHelper.accessor('Int_DrawStatus', {
      header: 'Draw Status',
      cell: ({ getValue }) => DRAW_STATUS_LABELS[getValue()] ?? String(getValue()),
    }),
    columnHelper.display({
      id: 'details',
      header: 'Details',
      cell: () => <span className="text-xs text-zinc-500 dark:text-zinc-400">Click row to expand</span>,
    }),
  ]

  const table = useReactTable({
    data: logs,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
    state: { expanded },
    onExpandedChange: (updater) => {
      const next = typeof updater === 'function' ? updater(expanded) : updater
      setExpanded(next)
    },
  })

  // ---- CSV helpers ----
  function csvEscape(v: unknown): string {
    if (v === null || v === undefined) return ''
    let s = String(v)
    if (s.includes('"')) s = s.replace(/"/g, '""')
    if (/[",\n]/.test(s)) s = `"${s}"`
    return s
  }
  function toISO(dt?: string) {
    if (!dt) return ''
    const d = new Date(dt)
    return isNaN(d.getTime()) ? dt : d.toISOString()
  }
  function stripHtml(html?: string) {
    if (!html) return ''
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  async function downloadCSV() {
    try {
      setExportErr(null)
      setExporting(true)
      const headers = [
        'Timestamp (ISO)',
        'Timestamp (Local)',
        'License No',
        'Raffle Name',
        'Location',
        'Draw Status (Code)',
        'Draw Status (Label)',
        'Sales Open (ISO)',
        'Sales Close (ISO)',
        'User ID',
        'Admin First Name',
        'Admin Last Name',
        'Game Details (plain)',
        'Game Rules (plain)',
      ]
      const rows = logs.map((l) => {
        const drawLabel = DRAW_STATUS_LABELS[l.Int_DrawStatus] ?? ''
        const vals = [
          toISO(l.Dt_CreateUpdate),
          l.Dt_CreateUpdate ? format(new Date(l.Dt_CreateUpdate), 'yyyy-MM-dd HH:mm:ss') : '',
          l.VC_LicenseNumb ?? '',
          l.VC_RaffleName ?? '',
          l.VC_RaffleLocation ?? '',
          l.Int_DrawStatus ?? '',
          drawLabel,
          toISO(l.Dt_SalesOpen),
          toISO(l.Dt_SalesClose),
          l.User_Id ?? '',
          l.VC_Admin_FirstName ?? '',
          l.VC_Admin_LastName ?? '',
          stripHtml(l.Txt_GameDetails),
          stripHtml(l.Txt_GameRules),
        ]
        return vals.map(csvEscape).join(',')
      })
      const csv = [headers.map(csvEscape).join(','), ...rows].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const date = new Date().toISOString().slice(0, 10)
      a.href = url
      a.download = `raffle-change-logs-${date}.csv`
      document.body.appendChild(a)
      a.click()
      URL.revokeObjectURL(url)
      a.remove()
    } catch (e: any) {
      setExportErr(e?.message || 'Failed to export CSV')
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      {/* Top bar */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Change Logs</div>
        <div className="flex items-center gap-2">
          {exportErr && (
            <span className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
              {exportErr}
            </span>
          )}
          <button
            type="button"
            onClick={downloadCSV}
            disabled={exporting || logs.length === 0}
            className={[
              'inline-flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm ring-1 ring-indigo-700/40 ring-inset',
              'hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300',
              'disabled:cursor-not-allowed disabled:opacity-60',
            ].join(' ')}
            aria-label="Download change logs as CSV"
            title="Download change logs as CSV"
          >
            {exporting ? 'Preparing CSV…' : 'Download CSV'}
          </button>
        </div>
      </div>

      {/* Container + table */}
      <div className="rounded border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <table className="w-full table-auto text-left text-sm text-zinc-900 dark:text-zinc-100">
          <thead className="bg-zinc-50 dark:bg-zinc-900/80">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-zinc-200 dark:border-zinc-800">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-[13px] font-semibold text-zinc-900 dark:text-zinc-100"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {table.getRowModel().rows.map((row) => (
              <React.Fragment key={row.id}>
                <tr
                  className="cursor-pointer align-top bg-white hover:bg-zinc-50 focus-within:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800/70 dark:focus-within:bg-zinc-800/70"
                  onClick={() => row.toggleExpanded()}
                  aria-expanded={row.getIsExpanded()}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      row.toggleExpanded()
                    }
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-2 align-top text-zinc-700 dark:text-zinc-200">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>

                {row.getIsExpanded() && (
                  <tr className="border-t border-zinc-200 dark:border-zinc-800">
                    <td
                      colSpan={columns.length}
                      className="bg-zinc-50 px-6 py-4 dark:bg-zinc-900/60"
                    >
                      {/* Expanded details panel */}
                      <div className="grid gap-3 md:grid-cols-2">
                        {/* Card 1 */}
                        <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
                          <div className="mb-2 text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                            Raffle Meta
                          </div>
                          <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                            <dt className="text-zinc-500 dark:text-zinc-400">Location</dt>
                            <dd className="break-words text-zinc-800 dark:text-zinc-100">
                              {row.original.VC_RaffleLocation || '—'}
                            </dd>

                            <dt className="text-zinc-500 dark:text-zinc-400">Sales Open</dt>
                            <dd className="text-zinc-800 dark:text-zinc-100">
                              {row.original.Dt_SalesOpen
                                ? format(new Date(row.original.Dt_SalesOpen), 'MMM d, yyyy, h:mm a')
                                : '—'}
                            </dd>

                            <dt className="text-zinc-500 dark:text-zinc-400">Sales Close</dt>
                            <dd className="text-zinc-800 dark:text-zinc-100">
                              {row.original.Dt_SalesClose
                                ? format(new Date(row.original.Dt_SalesClose), 'MMM d, yyyy, h:mm a')
                                : '—'}
                            </dd>

                            <dt className="text-zinc-500 dark:text-zinc-400">User ID</dt>
                            <dd className="break-words text-zinc-800 dark:text-zinc-100">
                              {row.original.User_Id || '—'}
                            </dd>

                            <dt className="text-zinc-500 dark:text-zinc-400">Admin</dt>
                            <dd className="text-zinc-800 dark:text-zinc-100">
                              {(row.original.VC_Admin_FirstName || '—')}{' '}
                              {(row.original.VC_Admin_LastName || '')}
                            </dd>
                          </dl>
                        </div>

                        {/* Card 2 */}
                        <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
                          <div className="mb-2 text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                            Draw Status
                          </div>
                          <div className="text-xs text-zinc-800 dark:text-zinc-100">
                            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                              Code: {row.original.Int_DrawStatus}
                            </span>
                            <span className="ml-2 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                              {DRAW_STATUS_LABELS[row.original.Int_DrawStatus] ?? 'Unknown'}
                            </span>
                          </div>
                        </div>

                        {/* Card 3: Game Details */}
                        <div className="md:col-span-2 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
                          <div className="mb-2 text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                            Game Details
                          </div>
                          <div
                            className="prose prose-sm max-w-none dark:prose-invert dark:prose-headings:text-zinc-100 dark:prose-p:text-zinc-200 dark:prose-strong:text-zinc-100 dark:prose-a:text-indigo-300 dark:prose-blockquote:text-zinc-300"
                            // The HTML comes from your backend; ensure it's trusted or sanitized upstream.
                            dangerouslySetInnerHTML={{ __html: row.original.Txt_GameDetails || '' }}
                          />
                        </div>

                        {/* Card 4: Game Rules */}
                        <div className="md:col-span-2 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
                          <div className="mb-2 text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                            Game Rules
                          </div>
                          <div
                            className="prose prose-sm max-w-none dark:prose-invert dark:prose-headings:text-zinc-100 dark:prose-p:text-zinc-200 dark:prose-strong:text-zinc-100 dark:prose-a:text-indigo-300 dark:prose-blockquote:text-zinc-300"
                            dangerouslySetInnerHTML={{ __html: row.original.Txt_GameRules || '' }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}