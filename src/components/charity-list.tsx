'use client'
import {useState, useEffect} from 'react'
import { useSession } from 'next-auth/react'
import { PlusIcon } from '@heroicons/react/16/solid'

import { Badge } from '@/components/badge'
import { Button } from '@/components/button'
import { Divider } from '@/components/divider'
import { Dropdown, DropdownButton, DropdownDivider, DropdownSection, DropdownItem, DropdownMenu } from '@/components/dropdown'
import { Heading } from '@/components/heading'
import { Input, InputGroup } from '@/components/input'
import { Link } from '@/components/link'
import { Select } from '@/components/select'
import { EllipsisVerticalIcon, MagnifyingGlassIcon } from '@heroicons/react/16/solid'

export default function CharityList() {
  const { data: session } = useSession()
  const [charities, setCharities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const statusMap: Record<
  number,
  { label: string; color: 'lime' | 'red' | 'zinc' }
> = {
  1: { label: 'Active', color: 'lime' },
  2: { label: 'Disabled', color: 'red' },
  3: { label: 'Review', color: 'zinc' },
};

  useEffect(() => {
    const fetchCharities = async () => {
      if (!session?.user?.email || !session?.user?.password) return

      // Step 1: Ask server to give you a JWT token
      const jwtResponse = await fetch('/api/create-jwt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          VC_Email: session.user.email,
          VC_Pwd: session.user.password,
        }),
      })

      const { token } = await jwtResponse.json()

      // Step 2: Use that token to call the protected API
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Charities`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const list = Array.isArray(data.obj_Charities) ? data.obj_Charities : []
      setCharities(list)
      setLoading(false)
    }

    fetchCharities().catch((err) => {
      setError(err.message)
      setLoading(false)
    })
  }, [session])

  if (loading) return <p>Loading...</p>
  if (error) return <p className='text-red-600'>Error: {error}</p>

  const handleActivate = async (id: string) => {
    if (!session?.user?.email || !session?.user?.password) return

    try {
      const jwtResponse = await fetch('/api/create-jwt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          VC_Email: session.user.email,
          VC_Pwd: session.user.password,
        }),
      })

      const { token } = await jwtResponse.json()

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Charities/Activate/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!res.ok) throw new Error(`Failed to activate charity (${res.status})`)

      // Refresh the list
      setCharities(prev =>
        prev.map(c => (c.Guid_CharityId === id ? { ...c, Int_CharityStatus: 1 } : c))
      )
    } catch (err) {
      console.error(err)
      alert('Could not activate charity.')
    }
  }

  const handleDeactivate = async (id: string) => {
    if (!session?.user?.email || !session?.user?.password) return

    try {
      const jwtResponse = await fetch('/api/create-jwt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          VC_Email: session.user.email,
          VC_Pwd: session.user.password,
        }),
      })

      const { token } = await jwtResponse.json()

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Charities/DeActivate/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!res.ok) throw new Error(`Failed to deactivate charity (${res.status})`)

      // Refresh the list
      setCharities(prev =>
        prev.map(c => (c.Guid_CharityId === id ? { ...c, Int_CharityStatus: 2 } : c))
      )
    } catch (err) {
      console.error(err)
      alert('Could not deactivate charity.')
    }
  }

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
        <Button color='blue' href="/charities/create-charity" className="flex items-center">
          <PlusIcon className="mr-2" />
          CREATE CHARITY
        </Button>
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
                          <DropdownSection>
                            <DropdownItem href="#">View</DropdownItem>
                            <DropdownItem>Edit</DropdownItem>
                          </DropdownSection>
                          <DropdownDivider />

                          <DropdownSection>
                            {(charity.Int_CharityStatus === 2 || charity.Int_CharityStatus === 3) && (
                              <DropdownItem onClick={() => handleActivate(charity.Guid_CharityId)}>
                                <span className="text-green-600 dark:text-green-400 group-data-[focus]:text-white">Activate</span>
                              </DropdownItem>
                            )}
                            {(charity.Int_CharityStatus === 1 || charity.Int_CharityStatus === 3) && (
                              <DropdownItem onClick={() => handleDeactivate(charity.Guid_CharityId)}>
                                <span className="text-red-600 dark:text-red-400 group-data-[focus]:text-white">Disable</span>
                              </DropdownItem>
                            )}
                          </DropdownSection>
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
