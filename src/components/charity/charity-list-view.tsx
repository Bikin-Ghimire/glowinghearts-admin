'use client'

import { Button } from '@/components/button'
import { Heading } from '@/components/heading'
import { Input, InputGroup } from '@/components/input'
import { Select } from '@/components/select'
import { Charity } from '@/types/charity'
import { PlusIcon } from '@heroicons/react/16/solid'
import { useState } from 'react'
import CharityListItem from './charity-list-item'

interface Props {
  charities: Charity[]
  refetchCharities: () => void
  session: any
}

export default function CharityListView({ charities, refetchCharities, session }: Props) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredCharities = charities.filter((charity) =>
    charity.VC_CharityDesc?.toLowerCase().includes(searchTerm.toLowerCase())
  )
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-sm:w-full sm:flex-1">
          <Heading>Charities</Heading>
          <p className="mt-2 text-sm/6 text-zinc-500">
            Create a new charity or manage existing ones. Select a charity to view details and start creating raffles. Use the search bar to find specific charities.
          </p>
          <div className="mt-4 flex max-w-xl gap-4">
            <InputGroup>
              <Input
                placeholder="Search charities…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
          </div>
        </div>
        <Button href="/charities/create-charity">
          <PlusIcon className="mr-2" />
          CREATE CHARITY
        </Button>
      </div>

      {filteredCharities.length === 0 ? (
        <p className="mt-4 text-zinc-500">No charities match your search.</p>
      ) : (
        <ul className="mt-10">
          {filteredCharities.map((charity) => (
            <CharityListItem
              key={charity.Guid_CharityId}
              charity={charity}
              session={session}
              refetchCharities={refetchCharities}
            />
          ))}
        </ul>
      )}
    </>
  )
}
