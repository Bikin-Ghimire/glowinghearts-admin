import { Button } from '@/components/button' // Adjust the path as needed
import { useState } from 'react'

interface Props {
  email: string
  charityName: string
  charityId: string
}

export function SendOnboardingButton({ email, charityName, charityId }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/send-onboarding-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, charityName, charityId }),
      })

      const ct = res.headers.get('content-type') || ''
      const raw = await res.text() // read once
      const json = ct.includes('application/json')
        ? (() => {
            try {
              return JSON.parse(raw)
            } catch {
              return null
            }
          })()
        : null

      if (!res.ok) {
        // Surface server detail if present; otherwise show first part of HTML/text
        const serverMsg = json?.error || raw.slice(0, 300)
        throw new Error(`Request failed (${res.status}). ${serverMsg}`)
      }

      alert(`Onboarding email sent!${json?.rid ? ` (ref: ${json.rid})` : ''}`)
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Button onClick={handleClick} disabled={loading}>
        {loading ? 'Sending...' : 'Send Stripe Onboarding Email'}
      </Button>
      {error && <p className="text-sm text-red-600">❌ {error}</p>}
    </div>
  )
}
