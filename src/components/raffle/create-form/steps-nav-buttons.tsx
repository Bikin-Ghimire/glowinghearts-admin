// components/raffle/StepNavigationButtons.tsx
'use client'

import React from 'react'

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
      p.name.trim() &&
      p.amount &&
      p.drawDate &&
      p.drawDate !== '0000-00-00 00:00:00' &&
      p.drawDate > salesStartDate
  )

  const bundlesValid = bundles.every(
    (b) =>
      b.numberOfTickets &&
      parseInt(b.numberOfTickets) > 0 &&
      b.price &&
      parseFloat(b.price) > 0 &&
      b.description.trim()
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
        onClick={() =>
          setCurrentStepIndex((prev: number) => Math.max(0, prev - 1))
        }
        disabled={currentStepIndex === 0}
        className={`rounded-md px-5 py-2.5 text-sm font-medium shadow-sm transition-colors
          ${
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
          onClick={() =>
            setCurrentStepIndex((prev: number) => Math.min(3, prev + 1))
          }
          disabled={isNextDisabled}
          className={`rounded-md px-5 py-2.5 text-sm font-medium shadow-sm transition-colors
            ${
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
          className="rounded-md bg-green-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-400 transition-colors"
        >
          Create Raffle
        </button>
      )}
    </div>
  )
}