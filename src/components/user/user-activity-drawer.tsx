// components/user/user-activity-drawer.tsx
'use client'

import { describeApiCall } from '@/lib/activity-map'
import { getUserActivity, last25HoursRange, type UserActivityItem } from '@/lib/users'
import { ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/16/solid'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import Icon from '../icon'

type Props = {
  open: boolean
  onClose: () => void
  session: any
  user: {
    Guid_UserId: string
    VC_FirstName?: string
    VC_LastName?: string
    VC_Email?: string
  } | null
}

function toLocal(dtIso: string) {
  try {
    const d = new Date(dtIso)
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return dtIso
  }
}

function severityClasses(sev?: 'info' | 'success' | 'warning' | 'danger') {
  switch (sev) {
    case 'success':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
    case 'warning':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
    case 'danger':
      return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300'
    default:
      return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200'
  }
}

function categoryTint(cat?: string) {
  // Subtle right-edge tint to group similar categories visually
  if (!cat) return 'border-zinc-200 dark:border-zinc-800'
  if (cat.startsWith('Auth')) return 'border-sky-200 dark:border-sky-900/40'
  if (cat.startsWith('User')) return 'border-indigo-200 dark:border-indigo-900/40'
  if (cat.startsWith('Access')) return 'border-teal-200 dark:border-teal-900/40'
  if (cat.startsWith('Charity')) return 'border-violet-200 dark:border-violet-900/40'
  if (cat.startsWith('Raffle')) return 'border-fuchsia-200 dark:border-fuchsia-900/40'
  if (cat.startsWith('Prize')) return 'border-amber-200 dark:border-amber-900/40'
  if (cat.startsWith('Buy-In')) return 'border-emerald-200 dark:border-emerald-900/40'
  if (cat.startsWith('Ticket')) return 'border-rose-200 dark:border-rose-900/40'
  if (cat.startsWith('Banner')) return 'border-pink-200 dark:border-pink-900/40'
  if (cat.startsWith('Template')) return 'border-cyan-200 dark:border-cyan-900/40'
  if (cat.startsWith('Reporting')) return 'border-lime-200 dark:border-lime-900/40'
  return 'border-zinc-200 dark:border-zinc-800'
}

export default function UserActivityDrawer({ open, onClose, session, user }: Props) {
  const { from: defaultFrom, to: defaultTo } = useMemo(() => last25HoursRange(), [])
  const [from, setFrom] = useState(defaultFrom) // "YYYY-MM-DD HH:mm:ss"
  const [to, setTo] = useState(defaultTo)
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<
    (UserActivityItem & { category: string; action: string; path: string; local: string })[]
  >([])

  // Refresh when open/user/date range changes
  useEffect(() => {
    if (!open || !user) return
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        const data = await getUserActivity(user.Guid_UserId, { from, to }, session)
        if (!alive) return
        const mapped = data.map((r) => {
          const d = describeApiCall(r.VC_API_Call)
          return { ...r, ...d, local: toLocal(r.Dt_CreateUpdate) }
        })
        setRows(mapped)
      } catch (e: any) {
        toast.error(e?.message || 'Failed to load activity')
      } finally {
        setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [open, user, from, to, session])

  // CSV: fetch fresh for chosen range and export (ensures full data for that range)
  async function downloadCSV() {
    try {
      if (!user) return
      const data = await getUserActivity(user.Guid_UserId, { from, to }, session)
      const mapped = data.map((r) => ({ ...r, ...describeApiCall(r.VC_API_Call) }))

      const headers = ['Timestamp (ISO)', 'Category', 'Action', 'Raw API Call']
      const lines = [headers, ...mapped.map((r) => [r.Dt_CreateUpdate, r.category, r.action, r.VC_API_Call])]
        .map((arr) =>
          arr
            .map((cell) => {
              const s = String(cell ?? '')
              return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
            })
            .join(',')
        )
        .join('\n')

      const blob = new Blob([lines], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const first = (user.VC_FirstName || 'User').trim() || 'User'
      const last = (user.VC_LastName || 'Activity').trim() || 'Activity'
      const range = `${(from || '').slice(0, 10)}_${(to || '').slice(0, 10)}`
      const file = `${first}_${last}_Activity_${range}.csv`.replace(/\s+/g, '_')
      const a = document.createElement('a')
      a.href = url
      a.download = file
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      toast.error(e?.message || 'Failed to export CSV')
    }
  }

  // Helpers to feed <input type="datetime-local">
  const fromDT = from.replace(' ', 'T')
  const toDT = to.replace(' ', 'T')

  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`}>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      {/* Drawer */}
      <aside
        className={`absolute inset-y-0 right-0 flex w-full max-w-2xl transform flex-col bg-white shadow-xl transition-transform dark:bg-zinc-900 ${open ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="activity-title"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="min-w-0">
            <h2 id="activity-title" className="truncate text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Activity — {user ? `${user.VC_FirstName ?? ''} ${user.VC_LastName ?? ''}`.trim() : ''}
            </h2>
            {user?.VC_Email && <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{user.VC_Email}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button
              className="inline-flex items-center gap-1 rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
              onClick={downloadCSV}
              title="Download CSV"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              CSV
            </button>
            <button
              className="rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              onClick={onClose}
              aria-label="Close activity panel"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="border-b border-zinc-200 px-5 py-3 dark:border-zinc-800">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs text-zinc-500 dark:text-zinc-400">From</label>
              <input
                type="datetime-local"
                className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                value={fromDT}
                onChange={(e) => setFrom(e.target.value.replace('T', ' '))}
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 dark:text-zinc-400">To</label>
              <input
                type="datetime-local"
                className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                value={toDT}
                onChange={(e) => setTo(e.target.value.replace('T', ' '))}
              />
            </div>
            {loading && <div className="ml-auto text-sm text-zinc-500 dark:text-zinc-400">Loading…</div>}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-5">
          {rows.length === 0 && !loading ? (
            <div className="text-sm text-zinc-500 dark:text-zinc-400">No activity found in this range.</div>
          ) : (
            <ul className="space-y-3">
              {rows.map((r, idx) => (
                <li
                  key={`${r.Dt_CreateUpdate}-${idx}`}
                  className={`rounded border bg-white p-3 shadow-sm dark:bg-zinc-950 ${categoryTint(r.category)}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        <span
                          className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${severityClasses((r as any).severity)}`}
                        >
                          <Icon name={(r as any).icon} className="h-3.5 w-3.5" />
                          {(r as any).action}
                        </span>
                        <span className="truncate text-zinc-900 dark:text-zinc-100">
                          <span className="font-medium">{r.category}</span>
                          <span className="text-zinc-500 dark:text-zinc-400"> · {r.path}</span>
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">{r.local}</div>
                  </div>

                  <div className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400" title={r.VC_API_Call}>
                    Raw: {r.VC_API_Call}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-zinc-200 px-5 py-3 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          CSV includes: timestamp (ISO), category, action, raw API call.
        </div>
      </aside>
    </div>
  )
}
