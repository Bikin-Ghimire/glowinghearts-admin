// components/icon.tsx
'use client'

import * as Lucide from 'lucide-react'

type Props = {
  name?: string
  className?: string
}

export default function Icon({ name, className }: Props) {
  if (!name) return null
  const Cmp = (Lucide as any)[name]
  if (!Cmp) return null
  return <Cmp className={className} aria-hidden />
}