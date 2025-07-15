'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Dialog } from '@headlessui/react'

import { PhotoIcon, UserCircleIcon } from '@heroicons/react/24/solid'
import { ChevronDownIcon } from '@heroicons/react/16/solid'

export default function CreateCharity() {
    const { data: session } = useSession()
    const [charityName, setCharityName] = useState('')
    const [logoURL, setLogoURL] = useState('')
    const [showSuccess, setShowSuccess] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!charityName || !logoURL || !session?.user?.email || !session?.user?.password) {
            alert('Missing fields or session')
            return
        }

        try {
            // Step 1: Get JWT token
            const jwtRes = await fetch('/api/create-jwt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                VC_Email: session.user.email,
                VC_Pwd: session.user.password,
            }),
            })

            const { token } = await jwtRes.json()

            // Step 2: Create Charity
            const charityRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Charities`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ VC_CharityDesc: charityName }),
            })

            const charityData = await charityRes.json()
            const Guid_CharityId = charityData?.Guid_CharityId

            if (!Guid_CharityId) {
            throw new Error('Failed to create charity')
            }

            // Step 3: Save Banner
            const bannerRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Banner`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                Guid_Id: Guid_CharityId,
                Int_BannerType: 1,
                VC_BannerLocation: logoURL,
            }),
            })

            const bannerData = await bannerRes.json()
            console.log('Banner saved:', bannerData)

            setShowSuccess(true)
        } catch (err) {
            console.error('Error:', err)
            alert('Something went wrong. Check console.')
        }
    }
  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-12">
        <div className="border-b border-gray-900/10 pb-12">
          <h1 className="text-2xl font-bold mb-10">Create a Charity</h1>

          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-4">
              <label htmlFor="charity-name" className="block text-sm/6 font-medium text-gray-900">
                Charity Name
              </label>
              <div className="mt-2">
                <input
                  id="charity-name"
                  name="charity-name"
                  type="text"
                  value={charityName}
                  onChange={(e) => setCharityName(e.target.value)}
                  autoComplete="charity-name"
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="sm:col-span-4">
              <label htmlFor="charity-logo" className="block text-sm/6 font-medium text-gray-900">
                Charity Logo Link
              </label>
              <div className="mt-2">
                <input
                  id="charity-logo"
                  name="charity-logo"
                  type="text"
                  value={logoURL}
                  onChange={(e) => setLogoURL(e.target.value)}
                  autoComplete="charity-logo"
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="sm:col-span-4">
              <label htmlFor="charity-description" className="block text-sm/6 font-medium text-gray-900">
                Charity Description
              </label>
              <div className="mt-2">
                <textarea
                  id="charity-description"
                  name="charity-description"
                  rows={3}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                  defaultValue={''}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-900/10 pb-12">
          <h2 className="text-base/7 font-semibold text-gray-900">Contsact Information</h2>
          <p className="mt-1 text-sm/6 text-gray-600">Add details of one direct contact for the charity.</p>

          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="first-name" className="block text-sm/6 font-medium text-gray-900">
                First name
              </label>
              <div className="mt-2">
                <input
                  id="first-name"
                  name="first-name"
                  type="text"
                  autoComplete="given-name"
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="last-name" className="block text-sm/6 font-medium text-gray-900">
                Last name
              </label>
              <div className="mt-2">
                <input
                  id="last-name"
                  name="last-name"
                  type="text"
                  autoComplete="family-name"
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="email" className="block text-sm/6 font-medium text-gray-900">
                Email address
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="phone" className="block text-sm/6 font-medium text-gray-900">
                Phone Number
              </label>
              <div className="mt-2">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-x-6">
        <button type="button" onClick={() => router.push('/charities')} className="text-sm/6 font-semibold text-gray-900">
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Save
        </button>
      </div>

      <Dialog open={showSuccess} onClose={() => {
        setShowSuccess(false)
        router.push('/charities')
        }} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="mx-auto max-w-sm rounded-lg bg-white p-6">
            <Dialog.Title className="text-lg font-medium text-gray-900">
                Charity Created
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-gray-600">
                Your charity details were successfully saved.
            </Dialog.Description>
            <div className="mt-4 flex justify-end">
                <button
                onClick={() => {
                    setShowSuccess(false)
                    router.push('/charities')
                }}
                className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                >
                OK
                </button>
            </div>
            </Dialog.Panel>
        </div>
      </Dialog>
    </form>
  )
}
