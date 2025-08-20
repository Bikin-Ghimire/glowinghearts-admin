'use client'

import { Button } from '@/components/button'
import { Field, Label } from '@/components/fieldset'
import { Heading } from '@/components/heading'
import { Input } from '@/components/input'
import { Text } from '@/components/text'
import { useResetPassword } from '@/hooks/use-reset-password'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Toaster, toast } from 'react-hot-toast'

// -----------------------------
// Utilities (same as UpdatePasswordForm)
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
      <div className="h-2 w-full overflow-hidden rounded bg-zinc-200 dark:bg-zinc-800">
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
  return hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
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
    const line = text.split('\n').find((l) => l.startsWith(suffix))
    if (!line) return { breached: false, count: 0 }
    const count = parseInt(line.split(':')[1] || '0', 10)
    return { breached: count > 0, count }
  } catch {
    return null // network issue → don’t block
  }
}

// Lazy-load zxcvbn (optional but nice)
async function loadZxcvbn() {
  try {
    const mod: any = await import(/* webpackIgnore: true */ 'zxcvbn')
    return mod.default ?? mod
  } catch {
    return null
  }
}

export function ResetPasswordForm({ key1, key2 }: { key1: string; key2: string }) {
  const { loading, error, success, submit } = useResetPassword(key1, key2)
  const router = useRouter()

  const [pwd, setPwd] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Security signals
  const [zxcvbnScore, setZxcvbnScore] = useState<0 | 1 | 2 | 3 | 4>(0)
  const [pwned, setPwned] = useState<{ breached: boolean; count: number } | null>(null)
  const pwnedTimer = useRef<number | null>(null)
  const zxcvbnRef = useRef<any>(null)

  useEffect(() => {
    loadZxcvbn().then((lib) => {
      zxcvbnRef.current = lib
      if (lib && pwd) {
        const s = Math.max(0, Math.min(4, lib(pwd)?.score ?? 0)) as 0 | 1 | 2 | 3 | 4
        setZxcvbnScore(s)
      }
    })
    return () => {
      if (pwnedTimer.current) window.clearTimeout(pwnedTimer.current)
    }
  }, [pwd])

  // Update strength & breach check when pwd changes
  useEffect(() => {
    if (zxcvbnRef.current) {
      const s = Math.max(0, Math.min(4, zxcvbnRef.current(pwd)?.score ?? 0)) as 0 | 1 | 2 | 3 | 4
      setZxcvbnScore(s)
    } else {
      // Fallback heuristic
      let s: 0 | 1 | 2 | 3 | 4 = 0
      if (pwd.length >= 8) s = 1
      if (pwd.length >= 12 && [UPPER, LOWER, DIGIT].every((r) => r.test(pwd))) s = 2
      if (pwd.length >= 12 && [UPPER, LOWER, DIGIT, SYMBOL].every((r) => r.test(pwd))) s = 3
      if (pwd.length >= 16 && [UPPER, LOWER, DIGIT, SYMBOL].every((r) => r.test(pwd))) s = 4
      setZxcvbnScore(s)
    }

    if (pwnedTimer.current) window.clearTimeout(pwnedTimer.current)
    if (!pwd) {
      setPwned(null)
      return
    }
    pwnedTimer.current = window.setTimeout(async () => {
      const res = await checkPwned(pwd)
      setPwned(res)
    }, 600)
  }, [pwd])

  // Requirements: mirror your UpdatePasswordForm (minus “different from current”)
  const requirements = useMemo(
    () => [
      { id: 'len', label: 'At least 12 characters', ok: pwd.length >= 12 },
      { id: 'upper', label: 'Contains an uppercase letter (A–Z)', ok: UPPER.test(pwd) },
      { id: 'lower', label: 'Contains a lowercase letter (a–z)', ok: LOWER.test(pwd) },
      { id: 'digit', label: 'Contains a number (0–9)', ok: DIGIT.test(pwd) },
      { id: 'symbol', label: 'Contains a symbol (e.g., !@#$%)', ok: SYMBOL.test(pwd) },
      { id: 'space', label: 'No spaces', ok: !WHITESPACE.test(pwd) },
      { id: 'strength', label: 'Not easily guessable (strength ≥ Fair)', ok: zxcvbnScore >= 2 },
      { id: 'breach', label: 'Not found in known breaches', ok: pwned ? !pwned.breached : true },
      { id: 'match', label: 'Matches confirmation', ok: pwd.length > 0 && pwd === confirm },
    ],
    [pwd, confirm, zxcvbnScore, pwned]
  )

  const unmet = requirements.filter((r) => !r.ok)
  const canSubmit = unmet.length === 0 && !loading

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    const { ok, message } = await submit(pwd)
    if (ok) {
      setPwd('')
      setConfirm('')
      setPwned(null)
      setZxcvbnScore(0)
      toast.success('Your password has been updated. Redirecting to login...')

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } else {
      toast.error(message || 'Unable to reset password. The link may be invalid or expired.')
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid w-full max-w-sm grid-cols-1 gap-6">
      <Heading>Choose a new password</Heading>
      <Text>Set a strong password to finish resetting your account.</Text>

      <Field>
        <Label htmlFor="new-password">New password</Label>
        <div className="relative">
          <Input
            id="new-password"
            type={showPwd ? 'text' : 'password'}
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            autoComplete="new-password"
            aria-describedby="password-help password-errors"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-2 my-auto flex items-center text-zinc-500 hover:text-zinc-700"
            onClick={() => setShowPwd((v) => !v)}
            aria-label={showPwd ? 'Hide new password' : 'Show new password'}
          >
            {showPwd ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
          </button>
        </div>

        {/* Strength meter */}
        <StrengthBar score={zxcvbnScore} />

        {/* Live requirements checklist */}
        <ul id="password-help" className="mt-3 space-y-1 text-sm">
          {requirements.map((req) => (
            <li key={req.id} className="flex items-center gap-2">
              <span
                className={classNames('inline-block h-2 w-2 rounded-full', req.ok ? 'bg-emerald-500' : 'bg-red-500')}
                aria-hidden
              />
              <span
                className={classNames(
                  req.ok ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                )}
              >
                {req.label}
                {req.id === 'breach' && pwned?.breached && (
                  <span className="ml-1">(seen {pwned.count.toLocaleString()}×)</span>
                )}
              </span>
            </li>
          ))}
        </ul>

        {/* Error block (only while there are unmet requirements) */}
        {unmet.length > 0 && (
          <div
            id="password-errors"
            className="mt-2 rounded-md bg-red-50 p-2 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-300"
          >
            Please address the following before continuing:
            <ul className="mt-1 list-disc pl-5">
              {unmet.map((r) => (
                <li key={r.id}>{r.label}</li>
              ))}
            </ul>
          </div>
        )}
      </Field>

      <Field>
        <Label htmlFor="confirm-password">Confirm new password</Label>
        <div className="relative">
          <Input
            id="confirm-password"
            type={showConfirm ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-2 my-auto flex items-center text-zinc-500 hover:text-zinc-700"
            onClick={() => setShowConfirm((v) => !v)}
            aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
          >
            {showConfirm ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
          </button>
        </div>
      </Field>

      <Button type="submit" className="w-full" disabled={!canSubmit || success}>
        {loading ? 'Saving…' : success ? 'Password updated' : 'Update password'}
      </Button>

      <div className="text-center text-sm">
        <Link href="/login" className="underline decoration-dotted underline-offset-4">
          ← Back to login
        </Link>
      </div>

      <p className="text-xs text-zinc-500">
        Tip: A passphrase of 4–5 random words (16+ chars) is both memorable and strong.
      </p>

      {error && !success && (
        <div className="rounded-md bg-red-50 p-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      <Toaster position="top-center" />
    </form>
  )
}
