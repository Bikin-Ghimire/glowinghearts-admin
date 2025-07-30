// components/raffle/PrizesStep.tsx
'use client'

export default function PrizesStep({ prizes, setPrizes, salesStartDate }: any) {
  const updatePrize = (index: number, field: string, value: any) => {
    setPrizes((prev: any[]) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    )
  }

  const addPrize = () => {
    setPrizes((prev: any[]) => [
      ...prev,
      {
        place: '',
        type: 1,
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
    setPrizes((prev: any[]) => prev.filter((_, i) => i !== index))
  }

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold">Prizes</h2>

      <div className="space-y-6">
        {prizes.map((prize: any, index: number) => (
          <div key={index} className="relative rounded-md border border-gray-200 p-4">
            {index > 0 && (
              <button
                type="button"
                onClick={() => removePrize(index)}
                className="absolute top-2 right-2 text-sm text-red-600 hover:underline"
              >
                Remove
              </button>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Prize Type</label>
                <select
                  value={prize.type}
                  onChange={(e) => updatePrize(index, 'type', parseInt(e.target.value))}
                  className="block w-full rounded-md border p-2"
                >
                  <option value={1}>50/50</option>
                  <option value={2}>Progressive</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Prize Name</label>
                <input
                  type="text"
                  value={prize.name}
                  onChange={(e) => updatePrize(index, 'name', e.target.value)}
                  placeholder="Prize Name"
                  className="block w-full rounded-md border p-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Prize Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={prize.amount}
                  onChange={(e) => updatePrize(index, 'amount', e.target.value)}
                  placeholder="Amount"
                  className="block w-full rounded-md border p-2"
                />
              </div>

              <div className="mt-6 flex items-center">
                <input
                  type="checkbox"
                  checked={prize.isPercentage}
                  onChange={(e) => updatePrize(index, 'isPercentage', e.target.checked)}
                  className="mr-2"
                />
                <label className="text-sm font-medium text-gray-700">Prize In Percentage</label>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">Draw Date</label>
                <input
                  type="datetime-local"
                  value={prize.drawDate}
                  onChange={(e) => updatePrize(index, 'drawDate', e.target.value)}
                  min={salesStartDate || new Date().toISOString().split('T')[0]}
                  className="block w-full rounded-md border p-2"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addPrize}
        className="mt-6 inline-block rounded-md bg-green-600 px-4 py-2 text-white"
      >
        + Add Prize
      </button>
    </div>
  )
}
