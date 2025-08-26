'use client'

import React, { useMemo, useState } from 'react'
import { format } from 'date-fns'

type PrizeLog = {
  Guid_PrizeId: string
  Int_Place: number
  Int_Prize_Type: number
  VC_Prize_Type: string
  Int_Prize_Status: number
  VC_Prize_Status: string
  Int_AutomatedDraw: number
  VC_Description: string
  Int_PrizeValuePercent: number
  Dec_Value: number
  Dt_Draw?: string | null          // ISO
  Guid_TicketId?: string | null
  JSON_PrizeNotes?: string | null
  Dt_CreateUpdate: string          // ISO
  User_id?: string
  VC_Admin_FirstName?: string | null
  VC_Admin_LastName?: string | null
}

type Props = { logs: PrizeLog[] }

function csvEscape(v: unknown) {
  if (v === null || v === undefined) return ''
  let s = String(v); if (s.includes('"')) s = s.replace(/"/g, '""')
  if (/[",\n]/.test(s)) s = `"${s}"`; return s
}
function toLocal(iso?: string | null, fmt = 'yyyy-MM-dd HH:mm:ss') {
  if (!iso) return ''
  const d = new Date(iso); return isNaN(d.getTime()) ? '' : format(d, fmt)
}
function toISO(iso?: string | null) {
  if (!iso) return ''
  const d = new Date(iso); return isNaN(d.getTime()) ? '' : d.toISOString()
}
function valueLabel(percentFlag: number, val: number) {
  return percentFlag ? `${(val * 100).toFixed(0)}%` : `$${Number(val).toFixed(2)}`
}

export function RafflePrizeLogsTab({ logs }: Props) {
  const [exporting, setExporting] = useState(false)
  const [exportErr, setExportErr] = useState<string | null>(null)

  const rows = useMemo(() => logs.map(l => ({
    id: l.Guid_PrizeId,
    place: l.Int_Place,
    type: l.VC_Prize_Type,
    status: l.VC_Prize_Status,
    auto: l.Int_AutomatedDraw === 1 ? 'Yes' : 'No',
    desc: l.VC_Description,
    value: valueLabel(l.Int_PrizeValuePercent, l.Dec_Value),
    drawLocal: toLocal(l.Dt_Draw),
    drawISO: toISO(l.Dt_Draw),
    ticket: l.Guid_TicketId ?? '—',
    admin: `${l.VC_Admin_FirstName ?? ''} ${l.VC_Admin_LastName ?? ''}`.trim() || l.User_id || '—',
    updatedLocal: toLocal(l.Dt_CreateUpdate),
    updatedISO: toISO(l.Dt_CreateUpdate),
  })), [logs])

  async function downloadCSV() {
    try {
      setExportErr(null); setExporting(true)
      const headers = [
        'Prize ID','Place','Type','Status','Automated Draw','Description','Value',
        'Draw (Local)','Draw (ISO)','Linked Ticket','Admin','Updated (Local)','Updated (ISO)'
      ]
      const lines = rows.map(r =>
        [r.id,r.place,r.type,r.status,r.auto,r.desc,r.value,r.drawLocal,r.drawISO,r.ticket,r.admin,r.updatedLocal,r.updatedISO]
          .map(csvEscape).join(',')
      )
      const csv = [headers.join(','), ...lines].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `raffle-prize-logs-${new Date().toISOString().slice(0,10)}.csv`
      document.body.appendChild(a); a.click(); URL.revokeObjectURL(url); a.remove()
    } catch (e:any) {
      setExportErr(e?.message || 'Failed to export CSV')
    } finally { setExporting(false) }
  }

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Prize Logs</div>
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
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm ring-1 ring-indigo-700/40 ring-inset hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {exporting ? 'Preparing CSV…' : 'Download CSV'}
          </button>
        </div>
      </div>

      <div className="rounded border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <table className="w-full table-auto text-left text-sm text-zinc-900 dark:text-zinc-100">
          <thead className="bg-zinc-50 dark:bg-zinc-900/80">
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <th className="px-4 py-3 text-[13px] font-semibold">Place</th>
              <th className="px-4 py-3 text-[13px] font-semibold">Type</th>
              <th className="px-4 py-3 text-[13px] font-semibold">Status</th>
              <th className="px-4 py-3 text-[13px] font-semibold">Auto</th>
              <th className="px-4 py-3 text-[13px] font-semibold">Description</th>
              <th className="px-4 py-3 text-[13px] font-semibold">Value</th>
              <th className="px-4 py-3 text-[13px] font-semibold whitespace-nowrap">Draw</th>
              <th className="px-4 py-3 text-[13px] font-semibold">Admin</th>
              <th className="px-4 py-3 text-[13px] font-semibold whitespace-nowrap">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {rows.map(r => (
              <tr key={r.id} className="align-top bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800/70">
                <td className="px-4 py-2">{r.place}</td>
                <td className="px-4 py-2">{r.type}</td>
                <td className="px-4 py-2">{r.status}</td>
                <td className="px-4 py-2">{r.auto}</td>
                <td className="px-4 py-2">
                  <div className="prose prose-sm max-w-[520px] dark:prose-invert">{r.desc}</div>
                </td>
                <td className="px-4 py-2">{r.value}</td>
                <td className="px-4 py-2 whitespace-nowrap">{r.drawLocal || '—'}</td>
                <td className="px-4 py-2">{r.admin}</td>
                <td className="px-4 py-2 whitespace-nowrap">{r.updatedLocal || '—'}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">No prize logs.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}