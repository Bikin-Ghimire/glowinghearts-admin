// components/raffle/StepNavigationButtons.tsx
'use client'

interface StepNavigationButtonsProps {
  currentStepIndex: number
  setCurrentStepIndex: (value: number | ((prev: number) => number)) => void
  selectedCharity?: any
  licenseNo: string
  raffleName: string
  raffleLocation: string
  salesStartDate: string
  salesEndDate: string
  bannerLink: string
  prizes: any[]
  bundles: any[]
  onSubmit: () => void
}

export default function StepNavigationButtons({
  currentStepIndex,
  setCurrentStepIndex,
  licenseNo,
  raffleName,
  raffleLocation,
  salesStartDate,
  salesEndDate,
  bannerLink,
  prizes,
  bundles,
  onSubmit,
}: StepNavigationButtonsProps) {
  const raffleDetailsValid =
    licenseNo.trim() &&
    raffleName.trim() &&
    raffleLocation.trim() &&
    salesStartDate &&
    salesEndDate &&
    bannerLink.trim() &&
    salesEndDate > salesStartDate

  const prizesValid = prizes.every(
    (p) =>
      // delegate to a small validator with awareness of first prize constraints
      () =>
        validatePrizes(prizes, salesStartDate, salesEndDate)
  )
  function validatePrizes(prizes: any[], salesStart: string, salesEnd: string) {
    if (!Array.isArray(prizes) || prizes.length === 0) return false
    const first = prizes[0]
    if (!(first?.type === 1 || first?.type === 3)) return false
    if (!first?.name?.trim()) return false
    if (first.type === 1) {
      if (Number(first.amount) !== 0.5) return false
      if (!(Number(first.isPercentage) === 1)) return false
    } else {
      if (!(Number(first.isPercentage) === 0)) return false
      if (!(first.amount && Number(first.amount) > 0)) return false
    }
    if (!(first.drawDate && first.drawDate !== '0000-00-00 00:00:00' && first.drawDate > salesEnd)) return false
    for (let i = 1; i < prizes.length; i++) {
      const p = prizes[i]
      if (!(p?.type === 2 || p?.type === 3)) return false
      if (!(Number(p.isPercentage) === 0)) return false
      if (!p.name?.trim()) return false
      if (!(p.amount && Number(p.amount) > 0)) return false
      if (!(p.drawDate && p.drawDate > salesStart && p.drawDate < first.drawDate)) return false
    }
    return true
  }

  const bundlesValid = bundles.every(
    (b) =>
      b.numberOfTickets && parseInt(b.numberOfTickets) > 0 && b.price && parseFloat(b.price) > 0 && b.description.trim()
  )

  const isNextDisabled =
    (currentStepIndex === 0 && !raffleDetailsValid) ||
    (currentStepIndex === 1 && !prizesValid) ||
    (currentStepIndex === 2 && !bundlesValid)

  return (
    <div className="mt-8 flex justify-between">
      {/* Previous button */}
      <button
        type="button"
        onClick={() => setCurrentStepIndex((prev: number) => Math.max(0, prev - 1))}
        disabled={currentStepIndex === 0}
        className={`rounded-md px-5 py-2.5 text-sm font-medium shadow-sm transition-colors ${
          currentStepIndex === 0
            ? 'cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
            : 'bg-gray-800 text-white hover:bg-gray-900 dark:bg-gray-600 dark:hover:bg-gray-500'
        }`}
      >
        Previous
      </button>

      {/* Next or Submit button */}
      {currentStepIndex < 3 ? (
        <button
          type="button"
          onClick={() => setCurrentStepIndex((prev: number) => Math.min(3, prev + 1))}
          disabled={isNextDisabled}
          className={`rounded-md px-5 py-2.5 text-sm font-medium shadow-sm transition-colors ${
            isNextDisabled
              ? 'cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400'
          }`}
        >
          Next
        </button>
      ) : (
        <button
          type="button"
          onClick={onSubmit}
          className="rounded-md bg-green-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-400"
        >
          Create Raffle
        </button>
      )}
    </div>
  )
}
