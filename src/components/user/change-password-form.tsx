'use client'

import { useState } from 'react'
import { useUpdatePassword } from '@/hooks/use-update-password'
import { Button } from '@/components/button'
import { Field, Label } from '@/components/fieldset'
import { Heading } from '@/components/heading'
import { Input } from '@/components/input'
import { Logo } from '@/app/logo'
import { Toaster } from 'react-hot-toast'

export default function UpdatePasswordForm() {
  const { updatePassword, loading } = useUpdatePassword()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!current || !next) return
    if (current === next) {
      // optional extra guard
      return window.alert('New password must be different from the current password.')
    }
    const ok = await updatePassword({ currentPassword: current, newPassword: next })
    if (ok) {
      setCurrent('')
      setNext('')
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid w-full max-w-sm grid-cols-1 gap-8">
      <Logo className="h-6 text-zinc-950 dark:text-white forced-colors:text-[CanvasText]" />
      <Heading>Update your password</Heading>

      <Field>
        <Label>Current Password</Label>
        <Input type="password" name="current-password" value={current} onChange={e => setCurrent(e.target.value)} />
      </Field>

      <Field>
        <Label>New Password</Label>
        <Input type="password" name="new-password" value={next} onChange={e => setNext(e.target.value)} />
      </Field>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Updating…' : 'Update password'}
      </Button>

      <Toaster position="top-center" />
    </form>
  )
}