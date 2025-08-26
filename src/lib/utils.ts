
import { formatInTimeZone } from 'date-fns-tz'

export const charityStatusMap: Record<number, { label: string; color: 'lime' | 'red' | 'zinc' }> = {
  1: { label: 'Active', color: 'lime' },
  2: { label: 'Disabled', color: 'red' },
  3: { label: 'Review', color: 'zinc' },
}

export const raffleStatusMap: Record<number, { label: string; color: string }> = {
  1: { label: 'Not Started', color: 'zinc' },
  2: { label: 'Active', color: 'lime' },
  3: { label: 'Sales Complete', color: 'amber' },
  4: { label: 'Draw Complete', color: 'cyan' },
  5: { label: 'Paid Out', color: 'emerald' },
  6: { label: 'On Hold', color: 'red' },
}

export const userStatusMap: Record<number, { label: string; color: string }> = {
  1: { label: 'Active', color: 'lime' },
  2: { label: 'Inactive', color: 'red' },
}

const APP_TZ = 'America/Toronto'

// Treat server string as UTC if it's naive (no timezone). Adjust if your server is not UTC.
export function parseServerToDate(dt?: string): Date | null {
  if (!dt || dt === '0000-00-00 00:00:00') return null
  // if it already ends with Z or has an offset, trust it
  if (/[zZ]|[+\-]\d{2}:?\d{2}$/.test(dt)) return new Date(dt)
  // otherwise, assume UTC naive and append Z
  return new Date(dt.replace(' ', 'T') + 'Z')
}

export function fmtLocal(dt?: string, fmt = 'MMMM d, yyyy, h:mm a z'): string {
  const d = parseServerToDate(dt)
  return d ? formatInTimeZone(d, APP_TZ, fmt) : 'TBD'
}