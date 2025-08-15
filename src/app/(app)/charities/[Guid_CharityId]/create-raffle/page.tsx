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
    <PrizesStep key="prizes" {...form} />,
    <BundlesStep key="bundles" {...form} />,
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
        !form.prizes.every(
          (p) =>
            p.name && p.amount && p.drawDate && p.drawDate !== '0000-00-00 00:00:00' && p.drawDate > form.salesStartDate
        )
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

  return (
    <div className="p-6">
      <h1 className="mb-8 text-2xl font-bold">Create a Raffle</h1>

      <RaffleStepsNav currentStepIndex={form.currentStepIndex} goToStep={goToStep} />

      <div className="mt-6">{steps[form.currentStepIndex]}</div>

      <StepNavigationButtons {...form} onSubmit={handleCreate} />
    </div>
  )
}
