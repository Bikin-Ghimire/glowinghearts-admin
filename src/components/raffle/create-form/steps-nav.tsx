// components/raffle/RaffleStepsNav.tsx
'use client'

import React from 'react'

const steps = [
  { id: 'Step 1', name: 'Raffle' },
  { id: 'Step 2', name: 'Prizes' },
  { id: 'Step 3', name: 'Ticket Bundles' },
  { id: 'Step 4', name: 'Review & Submit' },
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

          const borderClass =
            status === 'complete' || status === 'current'
              ? 'border-indigo-600 dark:border-indigo-400'
              : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600'

          const idTextClass =
            status === 'complete'
              ? 'text-indigo-600 group-hover:text-indigo-700 dark:text-indigo-400 dark:group-hover:text-indigo-300'
              : status === 'current'
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-zinc-500 group-hover:text-zinc-700 dark:text-zinc-400 dark:group-hover:text-zinc-200'

          const nameTextClass =
            status === 'complete' || status === 'current'
              ? 'text-zinc-900 dark:text-zinc-100'
              : 'text-zinc-700 dark:text-zinc-300'

          return (
            <li key={step.id} className="md:flex-1">
              <button
                type="button"
                onClick={() => goToStep(index)}
                aria-current={status === 'current' ? 'step' : undefined}
                className={[
                  'group flex w-full flex-col rounded-md',
                  // mobile: left border; desktop: top border
                  'border-l-4 py-2 pl-4 transition-colors md:border-t-4 md:border-l-0 md:pt-4 md:pb-0 md:pl-0',
                  borderClass,
                  // focus styles
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-indigo-400 dark:focus-visible:ring-offset-zinc-900',
                ].join(' ')}
              >
                <span className={['text-xs font-medium', idTextClass].join(' ')}>
                  {step.id}
                </span>
                <span className={['mt-0.5 text-sm font-medium', nameTextClass].join(' ')}>
                  {step.name}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}