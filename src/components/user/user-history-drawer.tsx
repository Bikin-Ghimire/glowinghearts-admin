// components/user/user-history-drawer.tsx
'use client'

import { getUserChanges, type UserChangeItem } from '@/lib/users'
import { ArrowDownTrayIcon, ClockIcon, XMarkIcon } from '@heroicons/react/16/solid'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'

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

type DerivedEventType =
  | 'password_reset'
  | 'password_change'
  | 'name_change'
  | 'email_change'
  | 'user_create'
  | 'status_change'
  | 'unknown_update'

// NOTE: add optional "note" so we can explain Unknown Update reason
type DerivedEvent = {
  type: DerivedEventType
  actor: string
  whenISO: string
  whenLocal: string
  actionRaw?: string
  subjectName: string
  email: string
  // diffs for tooltip/inline
  oldName?: string
  newName?: string
  oldEmail?: string
  newEmail?: string
  oldStatus?: string
  newStatus?: string
  note?: string
  // keep original record for CSV
  raw: UserChangeItem
}

function formatLocal(dtIso: string) {
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

function isResetRequestActor(fn?: string, ln?: string) {
  return fn?.toUpperCase() === 'RESET' && ln?.toUpperCase() === 'REQUEST'
}

function fullName(fn?: string, ln?: string) {
  return [fn, ln].filter(Boolean).join(' ').trim()
}

function sameNames(a?: { fn?: string; ln?: string }, b?: { fn?: string; ln?: string }) {
  const A = fullName(a?.fn, a?.ln).toLowerCase()
  const B = fullName(b?.fn, b?.ln).toLowerCase()
  return A.length > 0 && A === B
}

function actorDisplay(c: UserChangeItem) {
  const actorIsReset = isResetRequestActor(c.VC_Admin_FirstName, c.VC_Admin_LastName)
  const actorSameAsSubject = sameNames(
    { fn: c.VC_Admin_FirstName, ln: c.VC_Admin_LastName },
    { fn: c.VC_FirstName, ln: c.VC_LastName }
  )
  if (actorIsReset || actorSameAsSubject) return fullName(c.VC_FirstName, c.VC_LastName)
  return fullName(c.VC_Admin_FirstName, c.VC_Admin_LastName) || 'Unknown User'
}

function chipColor(type: DerivedEventType) {
  switch (type) {
    case 'password_reset':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
    case 'password_change':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
    case 'name_change':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'
    case 'email_change':
      return 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300'
    case 'user_create':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    case 'status_change':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
    default:
      return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200'
  }
}

function humanStatus(v: unknown) {
  // map your codes if needed; fallback to raw
  if (v === 1) return 'Active'
  if (v === 2) return 'Inactive'
  if (v === null || v === undefined) return ''
  return String(v)
}

// Build derived events by comparing each snapshot with the previous one (ascending → compare → render descending)
function deriveEvents(changes: UserChangeItem[]): DerivedEvent[] {
  if (!changes.length) return []
  const asc = [...changes].sort((a, b) => (a.Dt_CreateUpdate < b.Dt_CreateUpdate ? -1 : 1))

  const out: DerivedEvent[] = []
  for (let i = 0; i < asc.length; i++) {
    const cur = asc[i]
    const prev = i > 0 ? asc[i - 1] : undefined

    const subjectName = fullName(cur.VC_FirstName, cur.VC_LastName)
    const actor = actorDisplay(cur)
    const whenISO = cur.Dt_CreateUpdate
    const whenLocal = formatLocal(cur.Dt_CreateUpdate)

    const actorIsReset = isResetRequestActor(cur.VC_Admin_FirstName, cur.VC_Admin_LastName)
    const action = (cur.VC_Action ?? '').trim().toUpperCase()

    // 1) Password Reset Request
    if (actorIsReset) {
      out.push({
        type: 'password_reset',
        actor,
        whenISO,
        whenLocal,
        subjectName,
        email: cur.VC_Email ?? '',
        actionRaw: cur.VC_Action,
        raw: cur,
      })
      continue
    }

    // 2) Password Change when VC_Action is empty
    if (!action) {
      out.push({
        type: 'password_change',
        actor,
        whenISO,
        whenLocal,
        subjectName,
        email: cur.VC_Email ?? '',
        actionRaw: cur.VC_Action,
        raw: cur,
      })
      continue
    }

    // 3) User create — ONLY when raw action says CREATE (not inferred from !prev)
    if (action === 'CREATE') {
      out.push({
        type: 'user_create',
        actor,
        whenISO,
        whenLocal,
        subjectName,
        email: cur.VC_Email ?? '',
        actionRaw: cur.VC_Action,
        raw: cur,
      })
      continue
    }

    // Not CREATE. If there's no previous snapshot inside the range,
    // we can't compute diffs -> Unknown Update with a helpful note.
    if (!prev) {
      out.push({
        type: 'unknown_update',
        actor,
        whenISO,
        whenLocal,
        subjectName,
        email: cur.VC_Email ?? '',
        actionRaw: cur.VC_Action,
        note: 'no previous record in range',
        raw: cur,
      })
      continue
    }

    // UPDATEs: detect diffs
    let emitted = false

    // Name change
    const prevName = fullName(prev?.VC_FirstName, prev?.VC_LastName)
    if (subjectName && prevName && subjectName !== prevName) {
      out.push({
        type: 'name_change',
        actor,
        whenISO,
        whenLocal,
        subjectName,
        email: cur.VC_Email ?? '',
        actionRaw: cur.VC_Action,
        oldName: prevName,
        newName: subjectName,
        raw: cur,
      })
      emitted = true
    }

    // Email change
    if ((prev?.VC_Email ?? '') !== (cur?.VC_Email ?? '')) {
      out.push({
        type: 'email_change',
        actor,
        whenISO,
        whenLocal,
        subjectName,
        email: cur.VC_Email ?? '',
        actionRaw: cur.VC_Action,
        oldEmail: prev?.VC_Email ?? '',
        newEmail: cur?.VC_Email ?? '',
        raw: cur,
      })
      emitted = true
    }

    // Status change
    if (prev?.Int_UserStatus !== cur?.Int_UserStatus) {
      out.push({
        type: 'status_change',
        actor,
        whenISO,
        whenLocal,
        subjectName,
        email: cur.VC_Email ?? '',
        actionRaw: cur.VC_Action,
        oldStatus: humanStatus(prev?.Int_UserStatus),
        newStatus: humanStatus(cur?.Int_UserStatus),
        raw: cur,
      })
      emitted = true
    }

    if (!emitted) {
      out.push({
        type: 'unknown_update',
        actor,
        whenISO,
        whenLocal,
        subjectName,
        email: cur.VC_Email ?? '',
        actionRaw: cur.VC_Action,
        raw: cur,
      })
    }
  }

  return out.sort((a, b) => (a.whenISO < b.whenISO ? 1 : -1))
}

// Label function now accepts the whole event so it can include the note.
function labelForEvent(ev: DerivedEvent) {
  switch (ev.type) {
    case 'password_reset':  return 'Password Reset Request'
    case 'password_change': return 'Password Change'
    case 'name_change':     return 'Name Change'
    case 'email_change':    return 'Email Change'
    case 'user_create':     return 'User Create'
    case 'status_change':   return 'Status Change'
    case 'unknown_update':  return ev.note ? `Unknown Update (${ev.note})` : 'Unknown Update'
    default:                return 'Unknown Update'
  }
}

export default function UserHistoryDrawer({ open, onClose, session, user }: Props) {
  const [loading, setLoading] = useState(false)
  const [changes, setChanges] = useState<UserChangeItem[]>([])
  const [events, setEvents] = useState<DerivedEvent[]>([])

  // default: last 90 days
  const now = useMemo(() => new Date(), [])
  const defaultFrom = useMemo(() => {
    const d = new Date(now)
    d.setDate(d.getDate() - 90)
    d.setHours(0, 0, 0, 0)
    return d.toISOString().slice(0, 19).replace('T', ' ')
  }, [now])
  const defaultTo = useMemo(() => {
    const d = new Date(now)
    d.setHours(23, 59, 59, 0)
    return d.toISOString().slice(0, 19).replace('T', ' ')
  }, [now])

  const [from, setFrom] = useState(defaultFrom)
  const [to, setTo] = useState(defaultTo)

  function setAllTime() {
    setFrom('2000-01-01 00:00:00')
    setTo('2999-12-31 23:59:59')
  }

  useEffect(() => {
    if (!open || !user) return
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        const data = await getUserChanges(user.Guid_UserId, { from, to }, session)
        if (!alive) return
        setChanges(data)
        setEvents(deriveEvents(data))
      } catch (e: any) {
        toast.error(e?.message || 'Failed to load change log')
      } finally {
        setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user, from, to])

  // CSV file naming helpers
  function filenameRange(from: string, to: string) {
    const isAllTime = from <= '2000-01-01 00:00:00' && to >= '2999-12-31 23:59:59'
    if (isAllTime) return 'All-time'
    const start = (from || '').slice(0, 10) // 'YYYY-MM-DD'
    const end = (to || '').slice(0, 10)
    return `${start}_${end}`
  }

  function makeCsvFilename(user: Props['user'], from: string, to: string) {
    const first = (user?.VC_FirstName || 'User').trim() || 'User'
    const last = (user?.VC_LastName || 'History').trim() || 'History'
    const range = filenameRange(from, to)
    return `${first}_${last}_ChangeLogs_${range}.csv`.replace(/\s+/g, '_')
  }

  function downloadCSV() {
    try {
      const headers = [
        'Timestamp (Local)',
        'Timestamp (Iso)',
        'Event',
        'Change By',
        'First Name',
        'Last Name',
        'Email',
        'User Status',
      ]

      const rows = events.map((ev) => {
        const raw = ev.raw || ({} as Record<string, unknown>)
        const first = (raw as any).VC_FirstName ?? ''
        const last = (raw as any).VC_LastName ?? ''
        const email = (raw as any).VC_Email ?? ''
        const status = humanStatus((raw as any).Int_UserStatus)
        return [
          ev.whenLocal,
          ev.whenISO,
          labelForEvent(ev), // includes the note for Unknown Update
          ev.actor,
          first,
          last,
          email,
          status,
        ]
      })

      const csv = [headers, ...rows]
        .map((r) =>
          r
            .map((cell) => {
              const s = String(cell ?? '')
              return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
            })
            .join(',')
        )
        .join('\n')

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = makeCsvFilename(user, from, to)
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      toast.error(e?.message || 'Failed to export CSV')
    }
  }

  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`}>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      {/* Panel (scrollable) */}
      <aside
        className={`absolute inset-y-0 right-0 flex w-full max-w-xl transform flex-col bg-white shadow-xl transition-transform dark:bg-zinc-900 ${open ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-title"
      >
        {/* Sticky header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="min-w-0">
            <h2 id="history-title" className="truncate text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              History — {user ? `${user.VC_FirstName ?? ''} ${user.VC_LastName ?? ''}`.trim() : ''}
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
              aria-label="Close history panel"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Date range + All time */}
        <div className="border-b border-zinc-200 px-5 py-3 dark:border-zinc-800">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs text-zinc-500 dark:text-zinc-400">From</label>
              <input
                type="datetime-local"
                className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                value={from.replace(' ', 'T')}
                onChange={(e) => setFrom(e.target.value.replace('T', ' '))}
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 dark:text-zinc-400">To</label>
              <input
                type="datetime-local"
                className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                value={to.replace(' ', 'T')}
                onChange={(e) => setTo(e.target.value.replace('T', ' '))}
              />
            </div>

            <button
              className="ml-auto inline-flex items-center gap-1 rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
              onClick={setAllTime}
              title="Show all time"
            >
              All time
            </button>

            {loading && (
              <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                <ClockIcon className="h-4 w-4 animate-spin" />
                Loading…
              </div>
            )}
          </div>
        </div>

        {/* Scrollable body — Timeline of derived events with old→new */}
        <div className="flex-1 overflow-auto p-5">
          {!loading && events.length === 0 ? (
            <div className="text-sm text-zinc-500 dark:text-zinc-400">No changes found for this range.</div>
          ) : (
            <ul className="space-y-6">
              {events.map((ev, idx) => (
                <li key={`${ev.whenISO}-${idx}`} className="relative pl-6">
                  {/* line & dot */}
                  <span className="absolute top-1 left-1 h-full w-px bg-zinc-200 dark:bg-zinc-800" aria-hidden />
                  <span className="absolute top-1 left-0 h-2 w-2 rounded-full bg-zinc-400 dark:bg-zinc-600" aria-hidden />
                  {/* card */}
                  <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${chipColor(ev.type)}`}>
                        {labelForEvent(ev)}
                      </span>
                      <span
                        className="text-sm text-zinc-900 dark:text-zinc-100"
                        title={
                          ev.type === 'name_change' && ev.oldName
                            ? `Name: ${ev.oldName} → ${ev.newName}`
                            : ev.type === 'email_change' && ev.oldEmail
                            ? `Email: ${ev.oldEmail} → ${ev.newEmail}`
                            : ev.type === 'status_change' && ev.oldStatus
                            ? `Status: ${ev.oldStatus} → ${ev.newStatus}`
                            : ''
                        }
                      >
                        <span className="font-medium">by {ev.actor}</span>
                        <span className="text-zinc-500 dark:text-zinc-400"> · {ev.whenLocal}</span>
                      </span>
                    </div>

                    {/* If Unknown Update has a note, show it as a subtle subtitle */}
                    {ev.type === 'unknown_update' && ev.note && (
                      <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {ev.note}
                      </div>
                    )}

                    {/* Inline tiny old→new row (visible, not just tooltip) */}
                    {(ev.oldName || ev.oldEmail || ev.oldStatus) && (
                      <div className="mt-2 space-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {ev.oldName && (
                          <div>
                            <span className="font-medium">Name:</span> {ev.oldName} <span aria-hidden>→</span> {ev.newName}
                          </div>
                        )}
                        {ev.oldEmail && (
                          <div>
                            <span className="font-medium">Email:</span> {ev.oldEmail} <span aria-hidden>→</span> {ev.newEmail}
                          </div>
                        )}
                        {ev.oldStatus && (
                          <div>
                            <span className="font-medium">Status:</span> {ev.oldStatus} <span aria-hidden>→</span> {ev.newStatus}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Secondary line (subject + email) — kept hidden per your earlier preference */}
                    {/* <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                      {ev.subjectName}{ev.email ? ` • ${ev.email}` : ''}
                    </div> */}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-200 px-5 py-3 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          Times shown in your local timezone. Hover a date to see raw ISO/UTC.
        </div>
      </aside>
    </div>
  )
}