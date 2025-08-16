'use client'

import { Dialog, DialogActions, DialogBody, DialogDescription, DialogTitle } from '@/components//dialog'
import { Badge } from '@/components/badge'
import { Button } from '@/components/button'
import { Heading } from '@/components/heading'
import { Link } from '@/components/link'
import { SendOnboardingButton } from '@/components/onboarding-button'
import { charityStatusMap } from '@/lib/utils'
import { ChevronLeftIcon } from '@heroicons/react/16/solid'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

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
  const user = session?.user
  const [charityKey, setCharityKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const { label, color } = charityStatusMap[charity?.Int_CharityStatus] ?? {
    label: 'Unknown',
    color: 'zinc',
  }

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingCharityId, setPendingCharityId] = useState<string | null>(null)

  const [stripeStatus, setStripeStatus] = useState<{
    charges_enabled: boolean
    details_submitted: boolean
    payouts_enabled: boolean
  } | null>(null)

  useEffect(() => {
    const fetchStripeStatus = async () => {
      if (!charity?.VC_CharityKey) return

      const res = await fetch('/api/stripe-status-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: charity.VC_CharityKey }),
      })

      const data = await res.json()
      setStripeStatus(data)
    }

    fetchStripeStatus()
  }, [charity?.VC_CharityKey])

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
            <div className="mt-2 text-sm/6 text-zinc-500">Charity Key: {charity.VC_CharityKey}</div>
          </div>
        </div>
        { [1, 2].includes(user?.charityAccess?.[0]?.Int_UserAccess ?? 0) && (
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
            <div className="group relative">
              <Button
                color="green"
                onClick={() => handleActivate(charity.Guid_CharityId)}
                disabled={
                  !stripeStatus?.charges_enabled || !stripeStatus?.details_submitted || !stripeStatus?.payouts_enabled
                }
              >
                Activate
              </Button>
              {(!stripeStatus?.charges_enabled ||
                !stripeStatus?.details_submitted ||
                !stripeStatus?.payouts_enabled) && (
                <div className="absolute top-full left-1/2 z-10 mt-1 w-max -translate-x-1/2 rounded bg-zinc-800 px-2 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100">
                  Complete Stripe onboarding to activate
                </div>
              )}
            </div>
          )}
          {charity.Int_CharityStatus === 1 && (
            <Button
              color="red"
              onClick={() => {
                setPendingCharityId(charity.Guid_CharityId)
                setConfirmOpen(true)
              }}
            >
              Deactivate
            </Button>
          )}
        </div>
        )}
      </div>

      {!charity.VC_CharityKey && (
        <div className="mt-8">
          <SendOnboardingButton
            email={charity.VC_ContactEmail}
            charityName={charity.VC_CharityDesc}
            charityId={charity.Guid_CharityId}
          />
        </div>
      )}

      {stripeStatus &&
        (!stripeStatus.charges_enabled || !stripeStatus.details_submitted || !stripeStatus.payouts_enabled) && (
          <div className="mt-8">
            <Button
              onClick={async () => {
                const res = await fetch('/api/resend-onboarding-link', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    email: charity.VC_ContactEmail,
                    charityName: charity.VC_CharityDesc,
                    charityId: charity.Guid_CharityId,
                    stripeAccountId: charity.VC_CharityKey,
                  }),
                })

                const result = await res.json()
                if (res.ok) {
                  alert('Onboarding email sent successfully!')
                } else {
                  alert(`Error: ${result.error}`)
                }
              }}
            >
              Resend Stripe Onboarding Email
            </Button>
          </div>
        )}

      {stripeStatus && (
        <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">Stripe Account Status</h2>
          <div className="space-y-3 text-sm text-zinc-700 dark:text-zinc-200">
            <div className="flex items-center justify-between">
              <span>Charges Enabled</span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                  stripeStatus.charges_enabled
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}
              >
                {stripeStatus.charges_enabled ? '✅ Enabled' : '❌ Not Enabled'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span>Details Submitted</span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                  stripeStatus.details_submitted
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}
              >
                {stripeStatus.details_submitted ? '✅ Submitted' : '❌ Missing'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span>Payouts Enabled</span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                  stripeStatus.payouts_enabled
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}
              >
                {stripeStatus.payouts_enabled ? '✅ Enabled' : '❌ Not Enabled'}
              </span>
            </div>
          </div>
        </div>
      )}

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} size="sm">
        <DialogTitle>Confirm Action</DialogTitle>
        <DialogDescription>Are you sure you want to deactivate this charity?</DialogDescription>
        <DialogBody>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            This action will not affect ongoing raffles within the charity, but you will not be able to create new
            raffles until you activate it again.
          </p>
        </DialogBody>
        <DialogActions>
          <Button outline onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button
            color="red"
            onClick={() => {
              if (pendingCharityId) {
                handleDeactivate(pendingCharityId)
              }
              setConfirmOpen(false)
            }}
          >
            Yes, Deactivate
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
