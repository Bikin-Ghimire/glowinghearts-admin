'use client'

import { Badge } from '@/components/badge'
import { Button } from '@/components/button'
import { Heading } from '@/components/heading'
import { Link } from '@/components/link'
import { SendOnboardingButton } from '@/components/onboarding-button'
import { getTokenFromSession } from '@/hooks/use-session-token'
import { charityStatusMap } from '@/lib/utils'
import { ChevronLeftIcon } from '@heroicons/react/16/solid'
import { useSession } from 'next-auth/react'
import { useState } from 'react'

export function CharityOverview({
  charity,
  bannerUrl,
  handleActivate,
  handleDeactivate,
}: {
  charity: any
  bannerUrl: string | null
  handleActivate: (id: string) => void
  handleDeactivate: (id: string) => void
}) {
  const { data: session } = useSession()
  const [charityKey, setCharityKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const { label, color } = charityStatusMap[charity?.Int_CharityStatus] ?? {
    label: 'Unknown',
    color: 'zinc',
  }

  const updateCharityKey = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const token = await getTokenFromSession(session)
      if (!token) throw new Error('Not authenticated')

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Charities/${charity.Guid_CharityId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          VC_CharityDesc: charity.VC_CharityDesc,
          Txt_CharityDesc: charity.Txt_CharityDesc,
          VC_ContactFirstName: charity.VC_ContactFirstName,
          VC_ContactLastName: charity.VC_ContactLastName,
          VC_ContactEmail: charity.VC_ContactEmail,
          VC_ContactPhone: charity.VC_ContactPhone,
          VC_CharityKey: charityKey,
        }),
      })

      if (!res.ok) throw new Error('Failed to update charity key')
      setMessage('Charity key updated successfully.')
    } catch (err: any) {
      setMessage(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="max-lg:hidden">
        <Link href="/charities" className="inline-flex items-center gap-2 text-sm/6 text-zinc-500 dark:text-zinc-400">
          <ChevronLeftIcon className="size-4 fill-zinc-400 dark:fill-zinc-500" />
          Charity List
        </Link>
      </div>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="w-32 shrink-0">
            <img
              className="aspect-3/2 rounded-lg shadow-sm"
              src={bannerUrl || `https://placehold.co/300x200?text=No+Charity+Banner`}
              alt=""
            />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Heading>{charity.VC_CharityDesc}</Heading>
              <Badge color={color}>{label}</Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          {charity.Int_CharityStatus !== 1 ? (
            <Button outline href={`/charities/${charity.Guid_CharityId}/edit`}>
              Edit
            </Button>
          ) : (
            <div className="group relative">
              <Button outline disabled>
                Edit
              </Button>
              <div className="absolute top-full left-1/2 z-10 mt-1 w-max -translate-x-1/2 rounded bg-zinc-800 px-2 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100">
                Deactivate charity to edit details
              </div>
            </div>
          )}
          {charity.Int_CharityStatus !== 1 && (
            <Button color="green" onClick={() => handleActivate(charity.Guid_CharityId)}>
              Activate
            </Button>
          )}
          {charity.Int_CharityStatus === 1 && (
            <Button color="red" onClick={() => handleDeactivate(charity.Guid_CharityId)}>
              Deactivate
            </Button>
          )}
        </div>
      </div>

      {!charity.VC_CharityKey && (
        <div className="mt-8">
          <SendOnboardingButton email={charity.VC_ContactEmail} charityName={charity.VC_CharityDesc} />

          <div className="space-y-2">
            <input
              type="text"
              className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm dark:border-zinc-600"
              value={charityKey}
              onChange={(e) => setCharityKey(e.target.value)}
              placeholder="Enter charity key"
            />
            <Button onClick={updateCharityKey} disabled={loading || !charityKey}>
              {loading ? 'Saving...' : 'Save Charity Key'}
            </Button>
            {message && <p className="text-sm text-zinc-600 dark:text-zinc-300">{message}</p>}
          </div>
        </div>
      )}
    </>
  )
}
