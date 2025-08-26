'use client'

import React, { useMemo, useState } from 'react'
import { format } from 'date-fns'

type Refund = {
  Guid_RaffleId: string
  Guid_PurchaseId: string
  Guid_RefundId: string
  Dec_RefundAmount: number
  VC_Note?: string | null // JSON string: {"Dt_CreateUpdate":"...", "VC_Notes":"..."} (Dt may be naive)
  Dt_Credit?: string | null        // ISO with Z/offset
  Dt_CreateUpdate?: string | null  // ISO with Z/offset
  Guid_AdminId?: string | null
  Guid_IntentId?: string | null
  Dt_Purchased?: string | null     // ISO with Z/offset
  Int_TotalTickets?: number | null
  Dec_TotalPrice?: number | null
}

type Props = { refunds: Refund[] }

function csvEscape(v: unknown) {
  if (v === null || v === undefined) return ''
  let s = String(v)
  if (s.includes('"')) s = s.replace(/"/g, '""')
  if (/[",\n]/.test(s)) s = `"${s}"`
  return s
}
function toLocal(iso?: string | null, fmt = 'yyyy-MM-dd HH:mm:ss') {
  if (!iso) return ''
  const d = new Date(iso)
  return isNaN(d.getTime()) ? '' : format(d, fmt)
}
function toISO(iso?: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  return isNaN(d.getTime()) ? '' : d.toISOString()
}
function parseNote(json?: string | null) {
  if (!json) return { VC_Notes: '', Dt_CreateUpdate: '' }
  try {
    const o = JSON.parse(json)
    return { VC_Notes: o?.VC_Notes || '', Dt_CreateUpdate: o?.Dt_CreateUpdate || '' }
  } catch {
    return { VC_Notes: '', Dt_CreateUpdate: '' }
  }
}

export function RaffleRefundsTab({ refunds }: Props) {
  const [exporting, setExporting] = useState(false)
  const [exportErr, setExportErr] = useState<string | null>(null)

  const rows = useMemo(
    () =>
      refunds.map((r) => {
        const note = parseNote(r.VC_Note)
        return {
          refundId: r.Guid_RefundId,
          purchaseId: r.Guid_PurchaseId,
          amount: `$${Number(r.Dec_RefundAmount ?? 0).toFixed(2)}`,
          noteText: note.VC_Notes || '—',
          admin: r.Guid_AdminId || '—',
          creditedLocal: toLocal(r.Dt_Credit),
          creditedISO: toISO(r.Dt_Credit),
          updatedLocal: toLocal(r.Dt_CreateUpdate),
          updatedISO: toISO(r.Dt_CreateUpdate),

          // extra data for CSV only
          intentId: r.Guid_IntentId || '',
          purchasedLocal: toLocal(r.Dt_Purchased),
          purchasedISO: toISO(r.Dt_Purchased),
          totalTickets: r.Int_TotalTickets ?? '',
          totalPrice: r.Dec_TotalPrice != null ? `$${Number(r.Dec_TotalPrice).toFixed(2)}` : '',
          noteDtLocal: note.Dt_CreateUpdate ? toLocal(note.Dt_CreateUpdate.replace(' ', 'T') + 'Z') : '',
          noteDtISO: note.Dt_CreateUpdate ? new Date(note.Dt_CreateUpdate.replace(' ', 'T') + 'Z').toISOString() : '',
        }
      }),
    [refunds]
  )

  async function downloadCSV() {
    try {
      setExportErr(null)
      setExporting(true)

      const headers = [
        'Refund ID',
        'Purchase ID',
        'Refund Amount',
        'Note',
        'Admin',
        'Credited (Local)',
        'Credited (ISO)',
        'Updated (Local)',
        'Updated (ISO)',
        'Payment Intent',
        'Purchase Time (Local)',
        'Purchase Time (ISO)',
        'Original Tickets',
        'Original Total ($)',
        'Note Timestamp (Local)',
        'Note Timestamp (ISO)',
      ]

      const lines = rows.map((r) =>
        [
          r.refundId,
          r.purchaseId,
          r.amount,
          r.noteText === '—' ? '' : r.noteText,
          r.admin,
          r.creditedLocal,
          r.creditedISO,
          r.updatedLocal,
          r.updatedISO,
          r.intentId,
          r.purchasedLocal,
          r.purchasedISO,
          r.totalTickets,
          r.totalPrice,
          r.noteDtLocal,
          r.noteDtISO,
        ]
          .map(csvEscape)
          .join(',')
      )

      const csv = [headers.join(','), ...lines].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `raffle-refunds-${new Date().toISOString().slice(0, 10)}.csv`
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
        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Refunds</div>
        <div className="flex items-center gap-2">
          {exportErr && (
            <span className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
              {exportErr}
            </span>
          )}
          <button
            type="button"
            onClick={downloadCSV}
            disabled={exporting || refunds.length === 0}
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm ring-1 ring-indigo-700/40 ring-inset hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {exporting ? 'Preparing CSV…' : 'Download CSV'}
          </button>
        </div>
      </div>

      {/* Table (compact; no side scroll) */}
      <div className="rounded border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <table className="w-full table-auto text-left text-sm text-zinc-900 dark:text-zinc-100">
          <thead className="bg-zinc-50 dark:bg-zinc-900/80">
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <th className="px-4 py-3 text-[13px] font-semibold">Refund ID</th>
              <th className="px-4 py-3 text-[13px] font-semibold">Purchase ID</th>
              <th className="px-4 py-3 text-[13px] font-semibold">Amount</th>
              <th className="px-4 py-3 text-[13px] font-semibold">Note</th>
              <th className="px-4 py-3 text-[13px] font-semibold">Admin</th>
              <th className="px-4 py-3 text-[13px] font-semibold whitespace-nowrap">Credited</th>
              <th className="px-4 py-3 text-[13px] font-semibold whitespace-nowrap">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {rows.map((r) => (
              <tr key={r.refundId + '-' + r.purchaseId} className="align-top bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800/70">
                <td className="px-4 py-2 break-all">{r.refundId}</td>
                <td className="px-4 py-2 break-all">{r.purchaseId}</td>
                <td className="px-4 py-2">{r.amount}</td>
                <td className="px-4 py-2">
                  <div className="prose prose-sm max-w-[520px] line-clamp-3 hover:line-clamp-none dark:prose-invert">
                    {r.noteText}
                  </div>
                </td>
                <td className="px-4 py-2">{r.admin}</td>
                <td className="px-4 py-2 whitespace-nowrap">{r.creditedLocal || '—'}</td>
                <td className="px-4 py-2 whitespace-nowrap">{r.updatedLocal || '—'}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  No refunds.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}