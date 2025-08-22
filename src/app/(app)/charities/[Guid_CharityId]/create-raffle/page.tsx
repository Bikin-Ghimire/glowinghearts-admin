'use client'

import BundlesStep from '@/components/raffle/create-form/bundle-step'
import RaffleDetailsStep from '@/components/raffle/create-form/details-step'
import PrizesStep from '@/components/raffle/create-form/prizes-step'
import ReviewStep from '@/components/raffle/create-form/review-step'
import RaffleStepsNav from '@/components/raffle/create-form/steps-nav'
import StepNavigationButtons from '@/components/raffle/create-form/steps-nav-buttons'
import { useCreateRaffle } from '@/hooks/use-create-raffle'
import { useRaffleForm } from '@/hooks/use-raffle-form'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'

export default function CreateRafflePage() {
  const { data: session } = useSession()
  const params = useParams()
  const charityId = params?.Guid_CharityId as string
  const form = useRaffleForm()
  const { handleCreate } = useCreateRaffle({ ...form, charityId })

  const steps = [
    <RaffleDetailsStep key="details" {...form} />,
    <PrizesStep
      key="prizes"
      {...form}
      prizes={form.prizes.map((p) => ({
        ...p,
        amount: String(p.amount),
      }))}
      setPrizes={(updater: (prev: any[]) => any[]) =>
        form.setPrizes((prev) =>
          updater(
            prev.map((p) => ({
              ...p,
              amount: String(p.amount),
            }))
          ).map((p) => ({
            ...p,
            amount: String(p.amount),
          }))
        )
      }
      salesEndDate={form.salesEndDate}
    />,
    <BundlesStep
      key="bundles"
      {...form}
      bundles={form.bundles.map((b) => ({
        ...b,
        numberOfTickets: String(b.numberOfTickets),
        price: String(b.price),
        description: b.description ?? '',
      }))}
      setBundles={form.setBundles as unknown as (updater: (prev: any[]) => any[]) => void}
    />,
    <ReviewStep key="review" {...form} />,
  ]

  const goToStep = (index: number) => {
    let canGo = true

    for (let i = 0; i < index; i++) {
      if (
        i === 0 &&
        !(
          form.licenseNo &&
          form.raffleName &&
          form.raffleLocation &&
          form.salesStartDate &&
          form.salesEndDate &&
          form.bannerLink &&
          form.salesEndDate > form.salesStartDate
        )
      )
        canGo = false
      if (
        i === 1 &&
        !validatePrizes(form.prizes, form.salesStartDate, form.salesEndDate)
      )
        canGo = false
      if (
        i === 2 &&
        !form.bundles.every(
          (b) =>
            b.numberOfTickets && parseInt(b.numberOfTickets) > 0 && b.price && parseFloat(b.price) > 0 && b.description
        )
      )
        canGo = false
    }

    if (canGo) form.setCurrentStepIndex(index)
  }

  function validatePrizes(prizes: any[], salesStart: string, salesEnd: string) {
    if (!Array.isArray(prizes) || prizes.length === 0) return false
    const first = prizes[0]
    // First prize: type 1 or 3
    if (!(first?.type === 1 || first?.type === 3)) return false
    // First prize name: auto or user-entered
    if (!first?.name?.trim()) return false
    // Amount / percentage rules
    if (first.type === 1) {
      if (Number(first.amount) !== 0.5) return false
      if (!(Number(first.isPercentage) === 1)) return false
    } else {
      if (!(Number(first.isPercentage) === 0)) return false
      if (!(first.amount && Number(first.amount) > 0)) return false
    }
    // First draw must be after salesEnd
    if (!(first.drawDate && first.drawDate > salesEnd)) return false

    // Subsequent prizes
    for (let i = 1; i < prizes.length; i++) {
      const p = prizes[i]
      if (!(p?.type === 2 || p?.type === 3)) return false
      if (!(Number(p.isPercentage) === 0)) return false
      if (!(p.name?.trim())) return false
      if (!(p.amount && Number(p.amount) > 0)) return false
      if (!(p.drawDate && p.drawDate > salesStart && p.drawDate < first.drawDate)) return false
    }
    return true
  }

  return (
    <div className="p-6">
      <h1 className="mb-8 text-2xl font-bold">Create a Raffle</h1>

      <RaffleStepsNav currentStepIndex={form.currentStepIndex} goToStep={goToStep} />

      <div className="mt-6">{steps[form.currentStepIndex]}</div>

      <StepNavigationButtons {...form} onSubmit={handleCreate} />
    </div>
  )
}
