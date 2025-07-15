'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  Combobox,
  ComboboxLabel,
  ComboboxOption
} from '@/components/combobox'

const steps = [
  { id: 'Step 1', name: 'Charity' },
  { id: 'Step 2', name: 'Raffle' },
  { id: 'Step 3', name: 'Prizes' },
  { id: 'Step 4', name: 'Ticket Bundles' },
  { id: 'Step 5', name: 'Ticket Type' },
]

export default function RaffleCreation() {
    const { data: session } = useSession()
    // State for step navigation
    const [currentStepIndex, setCurrentStepIndex] = useState(0)

    // Charity data
    const [charities, setCharities] = useState<any[]>([])
    const [selectedCharity, setSelectedCharity] = useState<any>(null)
    const [query, setQuery] = useState('')

    // Raffle details
    const [licenseNo, setLicenseNo] = useState('')
    const [raffleName, setRaffleName] = useState('')
    const [raffleLocation, setRaffleLocation] = useState('')
    const [salesStartDate, setSalesStartDate] = useState('')
    const [salesEndDate, setSalesEndDate] = useState('')
    const [bannerLink, setBannerLink] = useState('')
    const raffleDetailsValid =
        licenseNo.trim() &&
        raffleName.trim() &&
        raffleLocation.trim() &&
        salesStartDate &&
        salesEndDate &&
        bannerLink.trim() &&
        salesEndDate > salesStartDate

    // Prize details
    const [prizes, setPrizes] = useState([
    {
        type: 1,
        name: '',
        amount: '',
        isPercentage: false,
        drawDate: ''
    }
    ])
    const prizesValid = prizes.every(
        p => p.name.trim() && p.amount && p.drawDate && p.drawDate > salesStartDate
    )
    // Update prize field
    const updatePrize = (index: number, field: string, value: any) => {
    setPrizes(prev =>
        prev.map((p, i) =>
        i === index ? { ...p, [field]: value } : p
        )
    )
    }
    // Add new prize row
    const addPrize = () => {
    setPrizes(prev => [
        ...prev,
        {
        type: 1,
        name: '',
        amount: '',
        isPercentage: false,
        drawDate: ''
        }
    ])
    }
    // Remove prize row
    const removePrize = (index: number) => {
    if (index === 0) return // Do not remove first
    setPrizes(prev => prev.filter((_, i) => i !== index))
    }

    // Ticket Bundles state
    const [bundles, setBundles] = useState([
    { numberOfTickets: '', price: '', description: '' }
    ])
    const bundlesValid = bundles.every(
    b =>
        b.numberOfTickets &&
        parseInt(b.numberOfTickets) > 0 &&
        b.price &&
        parseFloat(b.price) > 0 &&
        b.description.trim()
    )
    // Update a bundle row
    const updateBundle = (index: number, field: string, value: any) => {
    setBundles(prev =>
        prev.map((b, i) => (i === index ? { ...b, [field]: value } : b))
    )
    }
    // Add new bundle
    const addBundle = () => {
    setBundles(prev => [
        ...prev,
        { numberOfTickets: '', price: '', description: '' }
    ])
    }
    // Remove a bundle (but keep first mandatory)
    const removeBundle = (index: number) => {
    if (index === 0) return
    setBundles(prev => prev.filter((_, i) => i !== index))
    }

    // Ticket RNG Type ranges
    const [rngRange1, setRngRange1] = useState({ from: 0, to: 999 })
    const [rngRange2, setRngRange2] = useState({ from: 0, to: 999 })
    // Validate that ranges make sense
    const rngValid =
    rngRange1.from >= 0 &&
    rngRange1.from <= 998 &&
    rngRange1.to > rngRange1.from &&
    rngRange1.to <= 999 &&
    rngRange2.from >= 0 &&
    rngRange2.from <= 998 &&
    rngRange2.to > rngRange2.from &&
    rngRange2.to <= 999

  // Fetch charities with JWT
  useEffect(() => {
    async function fetchCharities() {
      if (!session?.user?.email || !session?.user?.password) return

      const jwtRes = await fetch('/api/create-jwt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          VC_Email: session.user.email,
          VC_Pwd: session.user.password,
        }),
      })

      const { token } = await jwtRes.json()

      const res = await fetch('/api/Charities', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const list = Array.isArray(data.obj_Charities)
        ? data.obj_Charities.filter((charity) => charity.Int_CharityStatus === 1)
        : []
      setCharities(list)
    }

    fetchCharities().catch(console.error)
  }, [session])

  const filteredCharities =
    query === ''
      ? charities
      : charities.filter((charity) =>
          charity.VC_CharityDesc.toLowerCase().includes(query.toLowerCase())
        )

  const goToStep = (index: number) => {
    let canGo = true

    // Validate steps up to the target index (inclusive)
    for (let i = 0; i < index; i++) {
        if (i === 0 && !selectedCharity) canGo = false
        if (i === 1 && !raffleDetailsValid) canGo = false
        if (i === 2 && !prizesValid) canGo = false
        if (i === 3 && !bundlesValid) canGo = false
        if (i === 4 && !rngValid) canGo = false
    }

    if (canGo) {
        setCurrentStepIndex(index)
    }
    }

  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1)
    }
  }

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-10">Create a Raffle</h1>

      {/* Progress Navigation */}
      <nav aria-label="Progress">
        <ol role="list" className="space-y-4 md:flex md:space-y-0 md:space-x-8">
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
                  className={`group flex flex-col border-l-4 py-2 pl-4
                    ${
                      status === 'complete'
                        ? 'border-indigo-600'
                        : status === 'current'
                        ? 'border-indigo-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }
                    md:border-t-4 md:border-l-0 md:pt-4 md:pb-0 md:pl-0`}
                >
                  <span
                    className={`text-sm font-medium
                      ${
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

      {/* Step Content */}
      <div className="mt-8 p-4 rounded-md">
        {currentStepIndex === 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Select Charity</h2>
            <p className='mb-5'>If you can't find your charity in the list below, make sure they are created and activated in <Link className='text-indigo-600 hover:text-indigo-800' href="/charities">Charity List</Link>.</p>

            <Combobox
              options={filteredCharities}
              value={selectedCharity}
              onChange={setSelectedCharity}
              displayValue={(option) => option?.VC_CharityDesc ?? ''}
              placeholder="Search charities"
              name="charity"
            >
              {(option) => (
                <ComboboxOption key={option.Guid_CharityId} value={option}>
                  {option.VC_CharityDesc}
                </ComboboxOption>
              )}
            </Combobox>
          </div>
        )}

        {currentStepIndex === 1 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Raffle Details</h2>

            <label className="block text-sm font-medium text-gray-700 mb-1">
              License Number
            </label>
            <input
              type="text"
              value={licenseNo}
              onChange={(e) => setLicenseNo(e.target.value)}
              placeholder="License Number"
              className="block w-full border p-2 rounded-md mb-4"
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Raffle Name (max 250 characters)
            </label>
            <input
              type="text"
              maxLength={250}
              value={raffleName}
              onChange={(e) => setRaffleName(e.target.value)}
              placeholder="Raffle Name"
              className="block w-full border p-2 rounded-md mb-4"
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Raffle Location
            </label>
            <input
              type="text"
              value={raffleLocation}
              onChange={(e) => setRaffleLocation(e.target.value)}
              placeholder="Raffle Location"
              className="block w-full border p-2 rounded-md mb-4"
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ticket Sales Start Date
            </label>
            <input
              type="date"
              value={salesStartDate}
              onChange={(e) => setSalesStartDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="block w-full border p-2 rounded-md mb-4"
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ticket Sales End Date
            </label>
            <input
              type="date"
              value={salesEndDate}
              onChange={(e) => setSalesEndDate(e.target.value)}
              min={salesStartDate || new Date().toISOString().split('T')[0]}
              className="block w-full border p-2 rounded-md mb-4"
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Banner Link (Image URL)
            </label>
            <input
              type="text"
              value={bannerLink}
              onChange={(e) => setBannerLink(e.target.value)}
              placeholder="https://example.com/banner.jpg"
              className="block w-full border p-2 rounded-md"
            />
          </div>
        )}

        {currentStepIndex === 2 && (
        <div>
            <h2 className="text-xl font-semibold mb-6">Prizes</h2>

            <div className="space-y-6">
            {prizes.map((prize, index) => (
                <div
                key={index}
                className="border border-gray-200 rounded-md p-4 relative"
                >
                {index > 0 && (
                    <button
                    type="button"
                    onClick={() => removePrize(index)}
                    className="absolute top-2 right-2 text-sm text-red-600 hover:underline"
                    >
                    Remove
                    </button>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                    {/* Prize Type */}
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prize Type
                    </label>
                    <select
                        value={prize.type}
                        onChange={(e) =>
                        updatePrize(index, 'type', parseInt(e.target.value))
                        }
                        className="block w-full border p-2 rounded-md"
                    >
                        <option value={1}>50/50</option>
                        <option value={2}>Progressive</option>
                    </select>
                    </div>

                    {/* Prize Name */}
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prize Name
                    </label>
                    <input
                        type="text"
                        value={prize.name}
                        onChange={(e) => updatePrize(index, 'name', e.target.value)}
                        placeholder="Prize Name"
                        className="block w-full border p-2 rounded-md"
                    />
                    </div>

                    {/* Prize Amount */}
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prize Amount
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        value={prize.amount}
                        onChange={(e) => updatePrize(index, 'amount', e.target.value)}
                        placeholder="Amount"
                        className="block w-full border p-2 rounded-md"
                    />
                    </div>

                    {/* Prize In Percentage */}
                    <div className="flex items-center mt-6">
                    <input
                        type="checkbox"
                        checked={prize.isPercentage}
                        onChange={(e) =>
                        updatePrize(index, 'isPercentage', e.target.checked)
                        }
                        className="mr-2"
                    />
                    <label className="text-sm font-medium text-gray-700">
                        Prize In Percentage
                    </label>
                    </div>

                    {/* Draw Date (always last row full width) */}
                    <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Draw Date
                    </label>
                    <input
                        type="date"
                        value={prize.drawDate}
                        onChange={(e) =>
                        updatePrize(index, 'drawDate', e.target.value)
                        }
                        min={salesStartDate || new Date().toISOString().split('T')[0]}
                        className="block w-full border p-2 rounded-md"
                    />
                    </div>
                </div>
                </div>
            ))}
            </div>

            <button
            type="button"
            onClick={addPrize}
            className="mt-6 inline-block px-4 py-2 bg-green-600 text-white rounded-md"
            >
            + Add Prize
            </button>
        </div>
        )}

        {currentStepIndex === 3 && (
        <div>
            <h2 className="text-xl font-semibold mb-6">Ticket Bundles</h2>

            <div className="space-y-6">
            {bundles.map((bundle, index) => (
                <div
                key={index}
                className="border border-gray-200 rounded-md p-4 relative"
                >
                {index > 0 && (
                    <button
                    type="button"
                    onClick={() => removeBundle(index)}
                    className="absolute top-2 right-2 text-sm text-red-600 hover:underline"
                    >
                    Remove
                    </button>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                    {/* Number of Tickets */}
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Number of Tickets
                    </label>
                    <input
                        type="number"
                        min="1"
                        value={bundle.numberOfTickets}
                        onChange={(e) =>
                        updateBundle(index, 'numberOfTickets', e.target.value)
                        }
                        placeholder="e.g., 50"
                        className="block w-full border p-2 rounded-md"
                    />
                    </div>

                    {/* Ticket Bundle Price */}
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bundle Price
                    </label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={bundle.price}
                        onChange={(e) =>
                        updateBundle(index, 'price', e.target.value)
                        }
                        placeholder="e.g., 20.00"
                        className="block w-full border p-2 rounded-md"
                    />
                    </div>

                    {/* Bundle Description */}
                    <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bundle Description
                    </label>
                    <input
                        type="text"
                        value={bundle.description}
                        onChange={(e) =>
                        updateBundle(index, 'description', e.target.value)
                        }
                        placeholder="Description"
                        className="block w-full border p-2 rounded-md"
                    />
                    </div>
                </div>
                </div>
            ))}
            </div>

            <button
            type="button"
            onClick={addBundle}
            className="mt-6 inline-block px-4 py-2 bg-green-600 text-white rounded-md"
            >
            + Add Bundle
            </button>
        </div>
        )}

        {currentStepIndex === 4 && (
        <div>
            <h2 className="text-xl font-semibold mb-6">Tickets RNG Type</h2>

            <div className="space-y-6">
            {/* First RNG Range */}
            <div className="border border-gray-200 rounded-md p-4">
                <h3 className="text-lg font-medium mb-4">First Number Block (3 digits)</h3>

                <div className="grid md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                    Range From
                    </label>
                    <input
                    type="number"
                    min={0}
                    max={998}
                    value={rngRange1.from}
                    onChange={(e) =>
                        setRngRange1({ ...rngRange1, from: parseInt(e.target.value) })
                    }
                    className="block w-full border p-2 rounded-md"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                    Range To
                    </label>
                    <input
                    type="number"
                    min={rngRange1.from + 1}
                    max={999}
                    value={rngRange1.to}
                    onChange={(e) =>
                        setRngRange1({ ...rngRange1, to: parseInt(e.target.value) })
                    }
                    className="block w-full border p-2 rounded-md"
                    />
                </div>
                </div>
            </div>

            {/* Second RNG Range */}
            <div className="border border-gray-200 rounded-md p-4">
                <h3 className="text-lg font-medium mb-4">Second Number Block (3 digits)</h3>

                <div className="grid md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                    Range From
                    </label>
                    <input
                    type="number"
                    min={0}
                    max={998}
                    value={rngRange2.from}
                    onChange={(e) =>
                        setRngRange2({ ...rngRange2, from: parseInt(e.target.value) })
                    }
                    className="block w-full border p-2 rounded-md"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                    Range To
                    </label>
                    <input
                    type="number"
                    min={rngRange2.from + 1}
                    max={999}
                    value={rngRange2.to}
                    onChange={(e) =>
                        setRngRange2({ ...rngRange2, to: parseInt(e.target.value) })
                    }
                    className="block w-full border p-2 rounded-md"
                    />
                </div>
                </div>
            </div>
            </div>
        </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStepIndex === 0}
            className={`px-4 py-2 rounded-md ${
              currentStepIndex === 0
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-gray-800 text-white'
            }`}
          >
            Previous
          </button>
          <button
            type="button"
            onClick={nextStep}
            disabled={
              currentStepIndex === steps.length - 1 ||
              (currentStepIndex === 0 && !selectedCharity) ||
              (currentStepIndex === 1 && !raffleDetailsValid) ||
              (currentStepIndex === 2 && !prizesValid) ||
              (currentStepIndex === 3 && !bundlesValid) ||
              (currentStepIndex === 4 && !rngValid)
            }
            className={`px-4 py-2 rounded-md ${
              currentStepIndex === steps.length - 1 ||
              (currentStepIndex === 0 && !selectedCharity) ||
              (currentStepIndex === 1 && !raffleDetailsValid) ||
              (currentStepIndex === 2 && !prizesValid) ||
              (currentStepIndex === 3 && !bundlesValid) ||
              (currentStepIndex === 4 && !rngValid)
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-indigo-600 text-white'
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}