// components/raffle/BundlesStep.tsx
'use client'

type Bundle = {
  numberOfTickets: string | number
  price: string | number
  description: string
}

interface Props {
  bundles: Bundle[]
  setBundles: (updater: (prev: Bundle[]) => Bundle[]) => void
}

export default function BundlesStep({ bundles, setBundles }: Props) {
  const updateBundle = (index: number, field: keyof Bundle, value: any) => {
    setBundles((prev) =>
      prev.map((b, i) => {
        if (i !== index) return b

        const updated = { ...b, [field]: value }

        const numTickets = Number(field === 'numberOfTickets' ? value : updated.numberOfTickets)
        const price = Number(field === 'price' ? value : updated.price)

        if (numTickets && price >= 0) {
          const ticketLabel = numTickets === 1 ? 'ticket' : 'tickets'
          updated.description = `${numTickets} ${ticketLabel} for $${price}`
        }

        return updated
      })
    )
  }

  const addBundle = () => {
    setBundles((prev) => [...prev, { numberOfTickets: '', price: '', description: '' }])
  }

  const removeBundle = (index: number) => {
    if (index === 0) return
    setBundles((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="text-zinc-900 dark:text-zinc-100">
      {/* Dark-mode autofill polish */}
      <style jsx global>{`
        input:-webkit-autofill {
          box-shadow: 0 0 0px 1000px transparent inset;
        }
        .dark input:-webkit-autofill {
          -webkit-text-fill-color: #e4e4e7;
          transition: background-color 9999s ease-in-out 0s;
          caret-color: #e4e4e7;
        }
      `}</style>

      <h2 className="mb-6 text-xl font-semibold">Ticket Bundles</h2>

      <div className="space-y-6">
        {bundles.map((bundle, index) => (
          <div
            key={index}
            className="relative rounded-md border border-zinc-200 bg-white p-4 shadow-sm
                       dark:border-zinc-700 dark:bg-zinc-900"
          >
            {index > 0 && (
              <button
                type="button"
                onClick={() => removeBundle(index)}
                className="absolute right-2 top-2 text-sm text-red-600 hover:underline dark:text-red-400"
              >
                Remove
              </button>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {/* Number of Tickets */}
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Number of Tickets
                </label>
                <input
                  type="number"
                  min={1}
                  value={bundle.numberOfTickets}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === '' || /^\d+$/.test(value)) {
                      updateBundle(index, 'numberOfTickets', value)
                    }
                  }}
                  placeholder="e.g., 50"
                  className="block w-full rounded-md border border-zinc-300 bg-white p-2 text-zinc-900
                             placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-600
                             dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder-zinc-500
                             dark:[color-scheme:dark]"
                />
              </div>

              {/* Bundle Price */}
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Bundle Price
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={bundle.price}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      updateBundle(index, 'price', value)
                    }
                  }}
                  placeholder="e.g., 20.00"
                  className="block w-full rounded-md border border-zinc-300 bg-white p-2 text-zinc-900
                             placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-600
                             dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder-zinc-500
                             dark:[color-scheme:dark]"
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Bundle Description
                </label>
                <input
                  type="text"
                  value={bundle.description}
                  onChange={(e) => updateBundle(index, 'description', e.target.value)}
                  placeholder="Description"
                  className="block w-full rounded-md border border-zinc-300 bg-white p-2 text-zinc-900
                             placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-600
                             dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder-zinc-500"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addBundle}
        className="mt-6 inline-block rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700
                   dark:bg-green-500 dark:text-zinc-900 dark:hover:bg-green-400"
      >
        + Add Bundle
      </button>
    </div>
  )
}