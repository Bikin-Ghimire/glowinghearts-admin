// components/raffle/BundlesStep.tsx
'use client'

export default function BundlesStep({ bundles, setBundles }: any) {
  const updateBundle = (index: number, field: string, value: any) => {
    setBundles((prev: any[]) =>
      prev.map((b, i) => (i === index ? { ...b, [field]: value } : b))
    )
  }

  const addBundle = () => {
    setBundles((prev: any[]) => [
      ...prev,
      { numberOfTickets: '', price: '', description: '' },
    ])
  }

  const removeBundle = (index: number) => {
    if (index === 0) return
    setBundles((prev: any[]) => prev.filter((_, i) => i !== index))
  }

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold">Ticket Bundles</h2>

      <div className="space-y-6">
        {bundles.map((bundle: any, index: number) => (
          <div key={index} className="relative rounded-md border border-gray-200 p-4">
            {index > 0 && (
              <button
                type="button"
                onClick={() => removeBundle(index)}
                className="absolute top-2 right-2 text-sm text-red-600 hover:underline"
              >
                Remove
              </button>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Number of Tickets</label>
                <input
                  type="number"
                  min="1"
                  value={bundle.numberOfTickets}
                  onChange={(e) => updateBundle(index, 'numberOfTickets', e.target.value)}
                  placeholder="e.g., 50"
                  className="block w-full rounded-md border p-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Bundle Price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={bundle.price}
                  onChange={(e) => updateBundle(index, 'price', e.target.value)}
                  placeholder="e.g., 20.00"
                  className="block w-full rounded-md border p-2"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">Bundle Description</label>
                <input
                  type="text"
                  value={bundle.description}
                  onChange={(e) => updateBundle(index, 'description', e.target.value)}
                  placeholder="Description"
                  className="block w-full rounded-md border p-2"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addBundle}
        className="mt-6 inline-block rounded-md bg-green-600 px-4 py-2 text-white"
      >
        + Add Bundle
      </button>
    </div>
  )
}
