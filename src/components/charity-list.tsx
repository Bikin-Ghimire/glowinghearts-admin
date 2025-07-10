'use client'
import {useState, useEffect} from 'react'

import { Badge } from '@/components/badge'
import { Button } from '@/components/button'
import { Divider } from '@/components/divider'
import { Dropdown, DropdownButton, DropdownItem, DropdownMenu } from '@/components/dropdown'
import { Heading } from '@/components/heading'
import { Input, InputGroup } from '@/components/input'
import { Link } from '@/components/link'
import { Select } from '@/components/select'
import { EllipsisVerticalIcon, MagnifyingGlassIcon } from '@heroicons/react/16/solid'

export default function CharityList() {
  const [charities, setCharities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const statusMap: Record<
  number,
  { label: string; color: 'lime' | 'red' | 'zinc' }
> = {
  1: { label: 'Active', color: 'lime' },
  2: { label: 'Deactive', color: 'red' },
  3: { label: 'New',    color: 'zinc' },
};

  useEffect(() => {
    fetch(`/api/Charities`)
        .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`)
                return res.json()
        })
        .then(data => {
            const list = Array.isArray(data.obj_Charities) ? data.obj_Charities : [];
            setCharities(list)
            setLoading(false)
        })
  }, [])

  if (loading) return <p>Loading...</p>
  if (error) return <p className='text-red-600'>Error: {error}</p>

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-sm:w-full sm:flex-1">
          <Heading>Charities</Heading>
          <div className="mt-4 flex max-w-xl gap-4">
            <div className="flex-1">
              <InputGroup>
                <MagnifyingGlassIcon />
                <Input name="search" placeholder="Search charities&hellip;" />
              </InputGroup>
            </div>
            <div>
              <Select name="sort_by">
                <option value="name">Sort by name</option>
                <option value="date">Sort by date</option>
                <option value="status">Sort by status</option>
              </Select>
            </div>
          </div>
        </div>
        <Button>Create charity</Button>
      </div>
      <ul className="mt-10">
        {charities.map((charity, index) => {
            const { label, color } = statusMap[charity.Int_CharityStatus] ?? {
              label: 'Unknown',
              color: 'zinc',
            };

            return (
                <li key={charity.Guid_CharityId}>
                    <Divider soft={index > 0} />
                    <div className="flex items-center justify-between">
                    <div key={charity.Guid_CharityId} className="flex gap-6 py-6">
                        <div className="space-y-1.5">
                        <div className="text-base/6 font-semibold">
                            <Link href={`/charities/${charity.Guid_CharityId}`}>{charity.VC_CharityDesc}</Link>
                        </div>
                        {/* <div className="text-xs/6 text-zinc-500">
                            {event.date} at {event.time} <span aria-hidden="true">·</span> {event.location}
                        </div>
                        <div className="text-xs/6 text-zinc-600">
                            {event.ticketsSold}/{event.ticketsAvailable} tickets sold
                        </div> */}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Badge className="max-sm:hidden" color={color}>
                        {label}
                        </Badge>
                        <Dropdown>
                        <DropdownButton plain aria-label="More options">
                            <EllipsisVerticalIcon />
                        </DropdownButton>
                        <DropdownMenu anchor="bottom end">
                            <DropdownItem href='#'>View</DropdownItem>
                            <DropdownItem>Edit</DropdownItem>
                            <DropdownItem>Delete</DropdownItem>
                        </DropdownMenu>
                        </Dropdown>
                    </div>
                    </div>
                </li>
            )
        })}
      </ul>
    </>
  )
}
