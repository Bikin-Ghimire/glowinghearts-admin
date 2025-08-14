// app/(whatever)/update-password/page.tsx
import type { Metadata } from 'next'
import UpdatePasswordForm from '@/components/user/change-password-form'

export const metadata: Metadata = {
  title: 'Update password',
}

export default function UpdatePasswordPage() {
  return <UpdatePasswordForm />
}