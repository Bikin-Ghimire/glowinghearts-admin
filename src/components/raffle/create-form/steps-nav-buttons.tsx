// components/raffle/StepNavigationButtons.tsx
'use client'

import React from 'react'

export default function StepNavigationButtons({
  currentStepIndex,
  setCurrentStepIndex,
  selectedCharity,
  licenseNo,
  raffleName,
  raffleLocation,
  salesStartDate,
  salesEndDate,
  bannerLink,
  prizes,
  bundles,
  onSubmit,
}: any) {
  const raffleDetailsValid =
    licenseNo.trim() &&
    raffleName.trim() &&
    raffleLocation.trim() &&
    salesStartDate &&
    salesEndDate &&
    bannerLink.trim() &&
    salesEndDate > salesStartDate

  const prizesValid = prizes.every(
    (p: any) => p.name.trim() && p.amount && p.drawDate && p.drawDate !== '0000-00-00 00:00:00' && p.drawDate > salesStartDate
  )

  const bundlesValid = bundles.every(
    (b: any) => b.numberOfTickets && parseInt(b.numberOfTickets) > 0 && b.price && parseFloat(b.price) > 0 && b.description.trim()
  )

  const isNextDisabled =
    currentStepIndex === 0 && !selectedCharity ||
    currentStepIndex === 1 && !raffleDetailsValid ||
    currentStepIndex === 2 && !prizesValid ||
    currentStepIndex === 3 && !bundlesValid

  return (
    <div className="mt-8 flex justify-between">
      <button
        type="button"
        onClick={() => setCurrentStepIndex((prev: number) => Math.max(0, prev - 1))}
        disabled={currentStepIndex === 0}
        className={`rounded-md px-4 py-2 ${
          currentStepIndex === 0 ? 'cursor-not-allowed bg-gray-300' : 'bg-gray-800 text-white'
        }`}
      >
        Previous
      </button>

      {currentStepIndex < 4 ? (
        <button
          type="button"
          onClick={() => setCurrentStepIndex((prev: number) => Math.min(4, prev + 1))}
          disabled={isNextDisabled}
          className={`rounded-md px-4 py-2 ${
            isNextDisabled ? 'cursor-not-allowed bg-gray-300' : 'bg-indigo-600 text-white'
          }`}
        >
          Next
        </button>
      ) : (
        <button
          type="button"
          onClick={onSubmit}
          className="rounded-md bg-green-600 px-4 py-2 text-white"
        >
          Create Raffle
        </button>
      )}
    </div>
  )
}