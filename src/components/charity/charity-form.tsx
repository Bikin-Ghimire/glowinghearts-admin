'use client'
import dynamic from 'next/dynamic'
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })

import { useCharityDetails } from '@/hooks/use-charity-details'
import { Dialog } from '@headlessui/react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface CharityFormProps {
  Guid_CharityId?: string
}

export default function CharityForm({ Guid_CharityId }: CharityFormProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [createdCharityId, setCreatedCharityId] = useState('')
  const [formData, setFormData] = useState({
    VC_CharityDesc: '',
    Txt_CharityDesc: '',
    VC_ContactFirstName: '',
    VC_ContactLastName: '',
    VC_ContactEmail: '',
    VC_ContactPhone: '',
    VC_CharityKey: '',
  })

  const [logoURL, setLogoURL] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const isEditMode = Boolean(Guid_CharityId)

  const { charity, bannerUrl, loading: charityLoading } = useCharityDetails(Guid_CharityId || '')
  useEffect(() => {
    if (isEditMode && charity) {
      setFormData({
        VC_CharityDesc: charity.VC_CharityDesc || '',
        Txt_CharityDesc: charity.Txt_CharityDesc || '',
        VC_ContactFirstName: charity.VC_ContactFirstName || '',
        VC_ContactLastName: charity.VC_ContactLastName || '',
        VC_ContactEmail: charity.VC_ContactEmail || '',
        VC_ContactPhone: charity.VC_ContactPhone || '',
        VC_CharityKey: charity.VC_CharityKey || '',
      })

      setLogoURL(bannerUrl || '')
    }
  }, [charity, bannerUrl, isEditMode])

  const getJWTToken = async () => {
    const jwtRes = await fetch('/api/create-jwt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        VC_Email: session?.user?.email,
        VC_Pwd: session?.user?.password,
      }),
    })
    const { token } = await jwtRes.json()
    return token
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = await getJWTToken()

    try {
      let charityId = Guid_CharityId

      if (!isEditMode) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Charities`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ VC_CharityDesc: formData.VC_CharityDesc }),
        })
        const data = await res.json()
        charityId = data?.Guid_CharityId
        if (!charityId) throw new Error('Failed to create charity')
      } else {
        charityId = Guid_CharityId
      }

      // Always set createdCharityId for redirect
      setCreatedCharityId(charityId!)

      // Update
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Charities/${charityId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      // Create/update banner
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Banner`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Guid_Id: charityId,
          Int_BannerType: 1,
          VC_BannerLocation: logoURL,
        }),
      })

      setShowSuccess(true)
    } catch (err) {
      console.error('Submit Error:', err)
      alert('Something went wrong.')
    }
  }

  if (isEditMode && charityLoading) {
    return <p>Loading charity...</p>
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-12">
        <div className="border-b border-gray-900/10 pb-12">
          <h1 className="mb-10 text-2xl font-bold">Create a Charity</h1>

          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-4">
              <label htmlFor="charity-name" className="block text-sm/6 font-medium text-gray-900">
                Charity Name
              </label>
              <div className="mt-2">
                <input
                  id="charity-name"
                  name="VC_CharityDesc"
                  type="text"
                  value={formData.VC_CharityDesc}
                  onChange={(e) => setFormData({ ...formData, VC_CharityDesc: e.target.value })}
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

            {/* <div className="sm:col-span-4">
              <label htmlFor="charity-key" className="block text-sm/6 font-medium text-gray-900">
                Charity Key
              </label>
              <div className="mt-2">
                <input
                  id="charity-key"
                  name="charity-key"
                  type="text"
                  value={formData.VC_CharityKey}
                  onChange={(e) => setFormData({ ...formData, VC_CharityKey: e.target.value })}
                  autoComplete="charity-key"
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div> */}

            <div className="sm:col-span-4">
              <label htmlFor="charity-description" className="block text-sm/6 font-medium text-gray-900">
                Charity Description
              </label>
              <div className="mt-2">
                <ReactQuill
                  theme="snow"
                  value={formData.Txt_CharityDesc}
                  onChange={(value) => setFormData({ ...formData, Txt_CharityDesc: value })}
                  placeholder="Write a description for your charity..."
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
                  name="VC_ContactFirstName"
                  value={formData.VC_ContactFirstName}
                  onChange={(e) => setFormData({ ...formData, VC_ContactFirstName: e.target.value })}
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
                  name="VC_ContactLastName"
                  value={formData.VC_ContactLastName}
                  onChange={(e) => setFormData({ ...formData, VC_ContactLastName: e.target.value })}
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
                  name="VC_ContactEmail"
                  value={formData.VC_ContactEmail}
                  onChange={(e) => setFormData({ ...formData, VC_ContactEmail: e.target.value })}
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
                  name="VC_ContactPhone"
                  value={formData.VC_ContactPhone}
                  onChange={(e) => setFormData({ ...formData, VC_ContactPhone: e.target.value })}
                  type="tel"
                  autoComplete="tel"
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-x-6">
        <button type="button" onClick={() => router.push('/charities')} className="text-sm font-semibold text-gray-900">
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500"
        >
          Save
        </button>
      </div>

      <Dialog
        open={showSuccess}
        onClose={() => {
          setShowSuccess(false)
          router.push('/charities/' + createdCharityId)
        }}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-sm rounded-lg bg-white p-6">
            <Dialog.Title className="text-lg font-medium text-gray-900">
              {isEditMode ? 'Charity Updated' : 'Charity Created'}
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-gray-600">
              Your charity details were successfully saved.
            </Dialog.Description>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setShowSuccess(false)
                  router.push('/charities/' + createdCharityId)
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
