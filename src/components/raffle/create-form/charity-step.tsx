// components/raffle/CharityStep.tsx
'use client'

import { Combobox, ComboboxOption } from '@/components/combobox'
import Link from 'next/link'

export default function CharityStep({ charities, selectedCharity, setSelectedCharity, query, setQuery }: any) {
  const filteredCharities =
    query === ''
      ? charities
      : charities.filter((charity: any) =>
          charity.VC_CharityDesc.toLowerCase().includes(query.toLowerCase())
        )

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Select Charity</h2>
      <p className="mb-5">
        If you can't find your charity in the list below, make sure they are created and activated in{' '}
        <Link className="text-indigo-600 hover:text-indigo-800" href="/charities">
          Charity List
        </Link>
        .
      </p>

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
  )
}
