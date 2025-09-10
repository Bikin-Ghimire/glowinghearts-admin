'use client'

import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { Logo } from '@/app/logo'
import { Button } from '@/components/button'
import { Checkbox, CheckboxField } from '@/components/checkbox'
import { Field, Label } from '@/components/fieldset'
import { Heading } from '@/components/heading'
import { Input } from '@/components/input'
import { Strong, Text, TextLink } from '@/components/text'

/** ---------------- Tiny toast system (self-contained) ---------------- */
function Toast({
  kind,
  children,
  onClose,
}: {
  kind: 'success' | 'error' | 'info'
  children: React.ReactNode
  onClose?: () => void
}) {
  const bg = kind === 'success' ? 'bg-emerald-600' : kind === 'error' ? 'bg-red-600' : 'bg-zinc-800'
  useEffect(() => {
    const t = setTimeout(() => onClose?.(), 4000)
    return () => clearTimeout(t)
  }, [onClose])
  return (
    <div className={`pointer-events-auto fixed right-6 bottom-6 z-50 rounded-xl px-4 py-3 text-white shadow-xl ${bg}`}>
      <div className="flex items-center gap-3">
        <span className="text-sm">{children}</span>
        <button className="py-1/2 ml-2 rounded px-2 text-xs/5 hover:opacity-80" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [trustDevice, setTrustDevice] = useState(true)

  const [otpStep, setOtpStep] = useState(false)
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)

  const [toast, setToast] = useState<null | { kind: 'success' | 'error' | 'info'; msg: string }>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [resendCooldown, setResendCooldown] = useState(0)
  const cooldownRef = useRef<NodeJS.Timeout | null>(null)

  const router = useRouter()

  useEffect(() => {
    if (resendCooldown > 0) {
      cooldownRef.current = setTimeout(() => setResendCooldown((s) => s - 1), 1000)
      return () => {
        if (cooldownRef.current) clearTimeout(cooldownRef.current)
      }
    }
  }, [resendCooldown])

  function showToast(kind: 'success' | 'error' | 'info', msg: string) {
    setToast({ kind, msg })
  }

  // Map server error codes to user-friendly messages
  function friendlyError(code?: string | null) {
    switch (code) {
      case 'ERR_CHECK_FAILED':
        return 'Invalid email or password.'
      case 'ERR_OTP_REQUIRED':
        return 'Please enter the 6-digit code from your email.'
      case 'ERR_OTP_INVALID':
        return 'That code was invalid or expired. Try again.'
      default:
        return 'Login failed. Please try again.'
    }
  }

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg(null)

    if (!email || !password) {
      setErrorMsg('Please enter your email and password.')
      return
    }

    setSending(true)
    // Bridge remember-me to httpOnly cookie via middleware
    document.cookie = `rememberMeForward=${remember}; path=/`

    // Try direct sign-in (admin will succeed, normal users will fail here)
    const tryDirect = await signIn('credentials', {
      email,
      password,
      twoFactorCode: '', // empty on purpose
      trustDevice: trustDevice ? 'true' : 'false',
      redirect: false,
      callbackUrl: '/',
    })

    if (tryDirect?.ok) {
      setSending(false)
      showToast('success', 'Signed in successfully.')
      const url = tryDirect.url || '/'
      router.replace(url)
      router.refresh()
      return
    }

    // Fall back to OTP request for non-admin users
    const r = await fetch('/api/otp/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    setSending(false)

    if (!r.ok) {
      const j = await r.json().catch(() => ({}))
      const msg = friendlyError(j?.error) || 'Could not send verification code.'
      setErrorMsg(msg)
      showToast('error', msg)
      return
    }

    // Success
    setOtpStep(true)
    setTwoFactorCode('')
    setResendCooldown(30) // 30s lockout on resend
    showToast('success', 'Verification code sent. Check your email and enter the 6-digit code below.')
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg(null)
    setVerifying(true)

    const res = await signIn('credentials', {
      email,
      password,
      twoFactorCode,
      trustDevice: trustDevice ? 'true' : 'false',
      redirect: false,
      callbackUrl: '/',
    })

    setVerifying(false)

    if (!res?.ok) {
      const msg = friendlyError(res?.error)
      setErrorMsg(msg)
      showToast('error', msg)
      return
    }

    // Trusted device cookie (optional)
    if (trustDevice) {
      await fetch('/api/trust-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }).catch(() => {})
    }

    showToast('success', 'Signed in successfully.')
    const url = res.url || '/'
    // Ensure UI updates with new session cookie
    router.replace(url)
    router.refresh()
  }

  async function handleResend() {
    if (resendCooldown > 0 || sending) return
    setErrorMsg(null)
    setSending(true)
    const r = await fetch('/api/otp/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    setSending(false)
    if (!r.ok) {
      const j = await r.json().catch(() => ({}))
      const msg = friendlyError(j?.error) || 'Could not resend code.'
      setErrorMsg(msg)
      showToast('error', msg)
      return
    }
    setResendCooldown(30)
    showToast('success', 'A new verification code was sent to your email.')
  }

  return (
    <div className="relative">
      {toast && (
        <Toast kind={toast.kind} onClose={() => setToast(null)}>
          {toast.msg}
        </Toast>
      )}

      <form onSubmit={otpStep ? handleVerify : handleSendCode} className="grid w-full max-w-sm grid-cols-1 gap-8">
        <Logo className="h-6 text-zinc-950 dark:text-white" />
        <Heading>Sign in to your account</Heading>

        {errorMsg && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
            {errorMsg}
          </div>
        )}

        <Field>
          <Label>Email</Label>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={otpStep || sending || verifying}
          />
        </Field>

        <Field>
          <Label>Password</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={otpStep || sending || verifying}
          />
        </Field>

        {!otpStep && (
          <>
            <div className="flex items-center justify-between">
              <CheckboxField>
                <Checkbox checked={remember} onChange={(v: boolean) => setRemember(v)} name="remember" />
                <Label>Remember me</Label>
              </CheckboxField>
              <Text>
                <TextLink href="/forgot-password">
                  <Strong>Forgot password?</Strong>
                </TextLink>
              </Text>
            </div>

            <CheckboxField>
              <Checkbox checked={trustDevice} onChange={(v: boolean) => setTrustDevice(v)} name="trustDevice" />
              <Label>Trust this device for 30 days (MFA bypass)</Label>
            </CheckboxField>

            <Button type="submit" className="w-full" disabled={sending}>
              {sending ? 'Sending…' : 'Send verification code'}
            </Button>
          </>
        )}

        {otpStep && (
          <>
            <div className="rounded-md bg-zinc-50 p-3 text-sm text-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-300">
              We emailed a 6-digit code to <strong>{email}</strong>. Enter it below to continue.
            </div>

            <Field>
              <Label>Verification code</Label>
              <Input
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                inputMode="numeric"
                pattern="\d*"
                placeholder="••••••"
                required
                disabled={verifying}
              />
            </Field>

            <div className="flex items-center justify-between">
              <Button type="submit" className="w-[60%]" disabled={verifying}>
                {verifying ? 'Verifying…' : 'Verify & Sign in'}
              </Button>

              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || sending}
                className={`text-sm underline-offset-2 hover:underline disabled:cursor-not-allowed ${
                  resendCooldown > 0 ? 'text-zinc-400' : 'text-zinc-700 dark:text-zinc-300'
                }`}
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
              </button>
            </div>

            <Button
              type="button"
              className="variant-secondary"
              onClick={() => setOtpStep(false)}
              disabled={verifying || sending}
            >
              Back
            </Button>
          </>
        )}
      </form>
    </div>
  )
}
