// app/users/reset-password/[key1]/[key2]/page.tsx (SERVER)
import type { Metadata } from 'next'
import { ResetPasswordForm } from './ResetPasswordForm'

export const metadata: Metadata = { title: 'Set new password' }

export default function Page({ params }: { params: { key1: string; key2: string } }) {
  return <ResetPasswordForm key1={params.key1} key2={params.key2} />
}