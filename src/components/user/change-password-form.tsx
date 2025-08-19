'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useUpdatePassword } from '@/hooks/use-update-password'
import { Button } from '@/components/button'
import { Field, Label } from '@/components/fieldset'
import { Heading } from '@/components/heading'
import { Input } from '@/components/input'
import { Logo } from '@/app/logo'
import { Toaster, toast } from 'react-hot-toast'
import { EyeIcon, EyeOffIcon } from 'lucide-react'

// -----------------------------
// Utilities
// -----------------------------
const UPPER = /[A-Z]/
const LOWER = /[a-z]/
const DIGIT = /\d/
const SYMBOL = /[^A-Za-z0-9\s]/
const WHITESPACE = /\s/

function classNames(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

// Small, accessible strength bar
function StrengthBar({ score }: { score: 0 | 1 | 2 | 3 | 4 }) {
  const labels = ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong']
  const pct = ((score + 1) / 5) * 100
  return (
    <div className="mt-2" aria-live="polite">
      <div className="h-2 w-full rounded bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
        <div
          className={classNames(
            'h-2 transition-all',
            score <= 1 && 'bg-red-500',
            score === 2 && 'bg-amber-500',
            score === 3 && 'bg-lime-500',
            score === 4 && 'bg-emerald-600'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{labels[score]}</p>
    </div>
  )
}

// Pwned Passwords (k-anonymity) check — no API key required
async function sha1Hex(message: string) {
  const enc = new TextEncoder()
  const data = enc.encode(message)
  const hashBuf = await crypto.subtle.digest('SHA-1', data)
  const hashArray = Array.from(new Uint8Array(hashBuf))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase()
}

async function checkPwned(password: string): Promise<{ breached: boolean; count: number } | null> {
  if (!password) return null
  try {
    const hash = await sha1Hex(password)
    const prefix = hash.slice(0, 5)
    const suffix = hash.slice(5)
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true' },
      cache: 'no-store',
    })
    const text = await res.text()
    // Lines look like: SUFFIX:COUNT
    const line = text.split('\n').find(l => l.startsWith(suffix))
    if (!line) return { breached: false, count: 0 }
    const count = parseInt(line.split(':')[1] || '0', 10)
    return { breached: count > 0, count }
  } catch {
    // network issues — treat as unknown (don't block user)
    return null
  }
}

// Load zxcvbn lazily if available. Optional, but gives better strength estimates.
async function loadZxcvbn() {
  try {
    const mod: any = await import(/* webpackIgnore: true */ 'zxcvbn')
    return mod.default ?? mod
  } catch {
    return null
  }
}

export default function UpdatePasswordForm() {
  const { updatePassword, loading } = useUpdatePassword()

  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNext, setShowNext] = useState(false)

  // Security signals
  const [zxcvbnScore, setZxcvbnScore] = useState<0 | 1 | 2 | 3 | 4>(0)
  const [pwned, setPwned] = useState<{ breached: boolean; count: number } | null>(null)
  const pwnedTimer = useRef<number | null>(null)
  const zxcvbnRef = useRef<any>(null)

  useEffect(() => {
    // Lazy-load zxcvbn in the background
    loadZxcvbn().then(lib => {
      zxcvbnRef.current = lib
      if (lib && next) {
        const s = Math.max(0, Math.min(4, lib(next)?.score ?? 0)) as 0 | 1 | 2 | 3 | 4
        setZxcvbnScore(s)
      }
    })
    // Cleanup any timers
    return () => {
      if (pwnedTimer.current) window.clearTimeout(pwnedTimer.current)
    }
  }, [])

  // Update strength score & pwned check when password changes (debounced)
  useEffect(() => {
    if (zxcvbnRef.current) {
      const s = Math.max(0, Math.min(4, zxcvbnRef.current(next)?.score ?? 0)) as 0 | 1 | 2 | 3 | 4
      setZxcvbnScore(s)
    } else {
      // Fallback heuristic if zxcvbn isn't available
      let s: 0 | 1 | 2 | 3 | 4 = 0
      if (next.length >= 8) s = 1
      if (next.length >= 12 && [UPPER, LOWER, DIGIT].every(r => r.test(next))) s = 2
      if (next.length >= 12 && [UPPER, LOWER, DIGIT, SYMBOL].every(r => r.test(next))) s = 3
      if (next.length >= 16 && [UPPER, LOWER, DIGIT, SYMBOL].every(r => r.test(next))) s = 4
      setZxcvbnScore(s)
    }

    // Debounce breach check (don’t send each keystroke)
    if (pwnedTimer.current) window.clearTimeout(pwnedTimer.current)
    if (!next) {
      setPwned(null)
      return
    }
    pwnedTimer.current = window.setTimeout(async () => {
      const res = await checkPwned(next)
      setPwned(res)
    }, 600)
  }, [next])

  // Requirements derived from OWASP Passwords Cheat Sheet (friendly subset)
  const requirements = useMemo(
    () => [
      {
        id: 'len',
        label: 'At least 12 characters',
        ok: next.length >= 12,
      },
      {
        id: 'upper',
        label: 'Contains an uppercase letter (A–Z)',
        ok: UPPER.test(next),
      },
      {
        id: 'lower',
        label: 'Contains a lowercase letter (a–z)',
        ok: LOWER.test(next),
      },
      {
        id: 'digit',
        label: 'Contains a number (0–9)',
        ok: DIGIT.test(next),
      },
      {
        id: 'symbol',
        label: 'Contains a symbol (e.g., !@#$%)',
        ok: SYMBOL.test(next),
      },
      {
        id: 'space',
        label: 'No spaces',
        ok: !WHITESPACE.test(next),
      },
      {
        id: 'different',
        label: 'Different from current password',
        ok: next.length > 0 && current.length > 0 ? next !== current : false,
      },
      {
        id: 'strength',
        label: 'Not easily guessable (strength ≥ Fair)',
        ok: zxcvbnScore >= 2,
      },
      {
        id: 'breach',
        label: 'Not found in known breaches',
        ok: pwned ? !pwned.breached : true, // if check failed, don’t block
      },
    ],
    [next, current, zxcvbnScore, pwned]
  )

  const unmet = requirements.filter(r => !r.ok)
  const canSubmit = unmet.length === 0 && !loading

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    const ok = await updatePassword({ currentPassword: current, newPassword: next })
    if (ok) {
      setCurrent('')
      setNext('')
      setPwned(null)
      setZxcvbnScore(0)
      toast.success('Password updated successfully.')
    } else {
      toast.error('Unable to update password. Please check your current password and try again.')
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid w-full max-w-sm grid-cols-1 gap-6">
      <Logo className="h-6 text-zinc-950 dark:text-white forced-colors:text-[CanvasText]" />
      <Heading>Update your password</Heading>

      <Field>
        <Label htmlFor="current-password">Current Password</Label>
        <div className="relative">
          <Input
            id="current-password"
            type={showCurrent ? 'text' : 'password'}
            name="current-password"
            value={current}
            onChange={e => setCurrent(e.target.value)}
            autoComplete="current-password"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-2 my-auto flex items-center text-zinc-500 hover:text-zinc-700"
            onClick={() => setShowCurrent(v => !v)}
            aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
          >
            {showCurrent ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
          </button>
        </div>
      </Field>

      <Field>
        <Label htmlFor="new-password">New Password</Label>
        <div className="relative">
          <Input
            id="new-password"
            type={showNext ? 'text' : 'password'}
            name="new-password"
            value={next}
            onChange={e => setNext(e.target.value)}
            autoComplete="new-password"
            aria-describedby="password-help password-errors"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-2 my-auto flex items-center text-zinc-500 hover:text-zinc-700"
            onClick={() => setShowNext(v => !v)}
            aria-label={showNext ? 'Hide new password' : 'Show new password'}
          >
            {showNext ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
          </button>
        </div>

        {/* Strength meter */}
        <StrengthBar score={zxcvbnScore} />

        {/* Live requirements checklist */}
        <ul id="password-help" className="mt-3 space-y-1 text-sm">
          {requirements.map(req => (
            <li key={req.id} className="flex items-center gap-2">
              <span
                className={classNames(
                  'inline-block h-2 w-2 rounded-full',
                  req.ok ? 'bg-emerald-500' : 'bg-red-500'
                )}
                aria-hidden
              />
              <span className={classNames(req.ok ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
                {req.label}
                {req.id === 'breach' && pwned?.breached && (
                  <span className="ml-1">(seen {pwned.count.toLocaleString()}×)</span>
                )}
              </span>
            </li>
          ))}
        </ul>

        {/* Error block (only shows while there are unmet requirements) */}
        {unmet.length > 0 && (
          <div id="password-errors" className="mt-2 rounded-md bg-red-50 p-2 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-300">
            Please address the following before continuing:
            <ul className="mt-1 list-disc pl-5">
              {unmet.map(r => (
                <li key={r.id}>{r.label}</li>
              ))}
            </ul>
          </div>
        )}
      </Field>

      <Button type="submit" className="w-full" disabled={!canSubmit}>
        {loading ? 'Updating…' : 'Update password'}
      </Button>

      <p className="text-xs text-zinc-500">
        Tip: A passphrase of 4–5 random words (16+ chars) is both memorable and strong.
      </p>

      <Toaster position="top-center" />
    </form>
  )
}