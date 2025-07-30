// components/raffle/RaffleStepsNav.tsx
'use client'

import React from 'react'

const steps = [
  { id: 'Step 1', name: 'Charity' },
  { id: 'Step 2', name: 'Raffle' },
  { id: 'Step 3', name: 'Prizes' },
  { id: 'Step 4', name: 'Ticket Bundles' },
  { id: 'Step 5', name: 'Review & Submit' },
]

export default function RaffleStepsNav({
  currentStepIndex,
  goToStep,
}: {
  currentStepIndex: number
  goToStep: (i: number) => void
}) {
  return (
    <nav aria-label="Progress">
      <ol className="space-y-4 md:flex md:space-y-0 md:space-x-8">
        {steps.map((step, index) => {
          const status =
            index < currentStepIndex
              ? 'complete'
              : index === currentStepIndex
              ? 'current'
              : 'upcoming'

          return (
            <li key={step.id} className="md:flex-1">
              <a
                href="#"
                onClick={() => goToStep(index)}
                className={`group flex flex-col border-l-4 py-2 pl-4 md:border-t-4 md:border-l-0 md:pt-4 md:pb-0 md:pl-0 ${
                  status === 'complete'
                    ? 'border-indigo-600'
                    : status === 'current'
                    ? 'border-indigo-600'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span
                  className={`text-sm font-medium ${
                    status === 'complete'
                      ? 'text-indigo-600 group-hover:text-indigo-800'
                      : status === 'current'
                      ? 'text-indigo-600'
                      : 'text-gray-500 group-hover:text-gray-700'
                  }`}
                >
                  {step.id}
                </span>
                <span className="text-sm font-medium">{step.name}</span>
              </a>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}