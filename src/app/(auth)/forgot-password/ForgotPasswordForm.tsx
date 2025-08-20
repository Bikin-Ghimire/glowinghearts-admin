// app/(auth)/forgot-password/ForgotPasswordForm.tsx
'use client'

import { useState } from 'react'
import { Logo } from '@/app/logo'
import { Button } from '@/components/button'
import { Field, Label } from '@/components/fieldset'
import { Heading } from '@/components/heading'
import { Input } from '@/components/input'
import { Strong, Text, TextLink } from '@/components/text'
import { useForgotPassword } from '@/hooks/use-forgot-password'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const { loading, error, successMsg, submit } = useForgotPassword()
  const emailOk = /^\S+@\S+\.\S+$/.test(email)

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!emailOk) return
    submit(email)
  }

  return (
    <form onSubmit={onSubmit} className="grid w-full max-w-sm grid-cols-1 gap-8">
      <Logo className="h-6 text-zinc-950 dark:text-white forced-colors:text-[CanvasText]" />
      <Heading>Reset your password</Heading>
      <Text>Enter your email and we’ll send you a link to reset your password.</Text>

      <Field>
        <Label>Email</Label>
        <Input
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
          required
          autoComplete="email"
        />
      </Field>

      <Button type="submit" className="w-full" disabled={loading || !emailOk}>
        {loading ? 'Sending…' : 'Reset password'}
      </Button>

      {successMsg && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          {successMsg}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <Text>
        <Strong>Tip:</Strong> If the email exists, you’ll get a link. Check spam if you don’t see it.
      </Text>

      {/* 👇 Back to login link */}
      <div className="text-center">
        <TextLink href="/login">← Back to login</TextLink>
      </div>
    </form>
  )
}