// components/raffle/PrizesStep.tsx
'use client'

import { useMemo } from 'react'

type Prize = {
  place: string
  type: number
  automated_draw: number
  name: string
  amount: string | number
  isPercentage: boolean | number // tolerated, but we control it
  prizeValue: string | number
  drawDate: string // ISO 'YYYY-MM-DDTHH:mm'
  ticketId: string | number | null
}

interface Props {
  prizes: Prize[]
  setPrizes: (updater: (prev: Prize[]) => Prize[]) => void
  prizeClaimPeriod: number | string
  setPrizeClaimPeriod: (v: number) => void
  salesStartDate: string // ISO or ''
  salesEndDate?: string // ISO or ''
}

export default function PrizesStep({
  prizes,
  setPrizes,
  prizeClaimPeriod,
  setPrizeClaimPeriod,
  salesStartDate,
  salesEndDate,
}: Props) {
  const minDateTime = useMemo(
    () =>
      salesStartDate && salesStartDate.length >= 16
        ? salesStartDate.slice(0, 16)
        : new Date().toISOString().slice(0, 16),
    [salesStartDate]
  )

  const updatePrize = (index: number, field: keyof Prize, value: any) => {
    setPrizes((prev) =>
      prev.map((p, i) => {
        if (i !== index) return p
        const isFirst = i === 0
        let next: Prize = { ...p, [field]: value }

        // Type-driven side effects
        if (field === 'type') {
          const t = Number(value)
          if (isFirst) {
            // first prize can be 50/50 (1) or Prize Raffle (3)
            if (t === 1) {
              next.name = p.name?.trim() ? p.name : '50% of Total Jackpot'
              next.amount = 0.5
              next.isPercentage = 1
            } else if (t === 3) {
              next.name = '' // force user entry
              next.amount = ''
              next.isPercentage = 0
            }
          } else {
            // subsequent prizes: only Early Bird (2) or Prize Raffle (3)
            next.isPercentage = 0
            if (t === 1) {
              // disallow 50/50 for non-first via immediate correction to Prize Raffle
              next.type = 3
            }
          }
        }

        // If user edits name/amount explicitly, keep our rules intact:
        if (isFirst && next.type === 1) {
          // Lock 50/50 invariants
          if (field === 'amount') next.amount = 0.5
          next.isPercentage = 1
        } else {
          // Non-50/50: always percentage=0
          next.isPercentage = 0
        }
        return next
      })
    )
  }

  const addPrize = () => {
    setPrizes((prev) => [
      ...prev,
      {
        place: '',
        type: 2,
        automated_draw: 1,
        name: '',
        amount: '',
        isPercentage: 0,
        prizeValue: '',
        drawDate: '',
        ticketId: null,
      },
    ])
  }

  const removePrize = (index: number) => {
    if (index === 0) return
    setPrizes((prev) => prev.filter((_, i) => i !== index))
  }

  // Helpers for draw date constraints
  const firstPrize = prizes[0]
  const firstDrawIso = firstPrize?.drawDate ? firstPrize.drawDate.slice(0, 16) : ''
  const salesStartIso = salesStartDate ? salesStartDate.slice(0, 16) : ''

  return (
    <div className="text-zinc-900 dark:text-zinc-100">
      {/* Dark mode fixes for native date/time controls + autofill */}
      <style jsx global>{`
        .dark input[type='date']::-webkit-calendar-picker-indicator,
        .dark input[type='time']::-webkit-calendar-picker-indicator,
        .dark input[type='datetime-local']::-webkit-calendar-picker-indicator {
          filter: invert(1) opacity(0.9);
        }
        input:-webkit-autofill {
          box-shadow: 0 0 0px 1000px transparent inset;
        }
        .dark input:-webkit-autofill {
          -webkit-text-fill-color: #e4e4e7;
          transition: background-color 9999s ease-in-out 0s;
          caret-color: #e4e4e7;
        }
      `}</style>

      <h2 className="mb-6 text-xl font-semibold">Prizes</h2>

      <div className="space-y-6">
        {prizes.map((prize, index) => {
          const isFirst = index === 0
          const prizeType = Number(prize.type)

          return (
            <div
              key={index}
              className="relative rounded-md border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => removePrize(index)}
                  className="absolute top-2 right-2 text-sm text-red-600 hover:underline dark:text-red-400"
                >
                  Remove
                </button>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                {/* Prize Type */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Prize Type</label>
                  <select
                    value={prize.type}
                    onChange={(e) => updatePrize(index, 'type', parseInt(e.target.value))}
                    className="block w-full rounded-md border border-zinc-300 bg-white p-2 text-zinc-900 focus:ring-2 focus:ring-indigo-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:[color-scheme:dark]"
                  >
                    {isFirst ? (
                      <>
                        <option value={1}>50/50 Cash</option>
                        <option value={3}>Prize Raffle</option>
                      </>
                    ) : (
                      <>
                        <option value={2}>Early Bird</option>
                        <option value={3}>Prize Raffle</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Prize Name */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Prize Name</label>
                  <input
                    type="text"
                    value={prize.name}
                    onChange={(e) => updatePrize(index, 'name', e.target.value)}
                    placeholder="Prize Name"
                    className="block w-full rounded-md border border-zinc-300 bg-white p-2 text-zinc-900 placeholder-zinc-400 focus:ring-2 focus:ring-indigo-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder-zinc-500 dark:[color-scheme:dark]"
                  />
                </div>

                {/* Prize Amount */}
                <div className={`${isFirst && prizeType === 1 ? 'hidden' : ''}`}>
                  <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Prize Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={prize.amount}
                    onChange={(e) => updatePrize(index, 'amount', e.target.value)}
                    placeholder="Amount"
                    className="block w-full rounded-md border border-zinc-300 bg-white p-2 text-zinc-900 placeholder-zinc-400 focus:ring-2 focus:ring-indigo-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder-zinc-500 dark:[color-scheme:dark]"
                  />
                </div>

                {/* Percentage is hidden and controlled in state logic */}

                {/* Draw Date */}
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Draw Date</label>
                  <input
                    type="datetime-local"
                    value={prize.drawDate}
                    onChange={(e) => {
                      const val = e.target.value
                      // First prize: must be after salesEndDate (parent also validates on Next)
                      if (isFirst) {
                        if (salesEndDate && val <= salesEndDate.slice(0, 16)) {
                          alert('Main prize draw must be after sales end date.')
                          return
                        }
                        updatePrize(index, 'drawDate', val)
                        return
                      }
                      // Subsequent prizes: between sales start and first prize draw
                      if (salesStartIso && val < salesStartIso) {
                        alert('Draw date must be after ticket sales start.')
                        return
                      }
                      if (firstDrawIso && val >= firstDrawIso) {
                        alert('Draw date must be before the main draw date.')
                        return
                      }
                      updatePrize(index, 'drawDate', val)
                    }}
                      min={isFirst
    ? (salesEndDate ? salesEndDate.slice(0, 16) : minDateTime)
    : (salesStartIso || minDateTime)}
                    max={!isFirst && firstDrawIso ? firstDrawIso : undefined}
                    className="block w-full rounded-md border border-zinc-300 bg-white p-2 text-zinc-900 focus:ring-2 focus:ring-indigo-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:[color-scheme:dark]"
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <button
        type="button"
        onClick={addPrize}
        className="mt-6 inline-block rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 dark:bg-green-500 dark:text-zinc-900 dark:hover:bg-green-400"
      >
        + Add Prize
      </button>

      {/* Claim Period */}
      <label className="mt-5 mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Prize Claim Period</label>
      <input
        type="number"
        min={0}
        value={prizeClaimPeriod}
        onChange={(e) => {
          const value = Math.max(0, Number(e.target.value))
          setPrizeClaimPeriod(value)
        }}
        placeholder="Enter number of days (e.g., 30)"
        className="mb-4 block w-full rounded-md border border-zinc-300 bg-white p-2 text-zinc-900 placeholder-zinc-400 focus:ring-2 focus:ring-indigo-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder-zinc-500 dark:[color-scheme:dark]"
      />
    </div>
  )
}
