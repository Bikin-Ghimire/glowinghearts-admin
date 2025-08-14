'use client'
import dynamic from 'next/dynamic'
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })

import { useCharityDetails } from '@/hooks/use-charity-details'
import { getTokenFromSession } from '@/hooks/use-session-token'
import { Dialog } from '@headlessui/react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

const isValidImageUrl = (url: string) => {
  try {
    const u = new URL(url)
    if (!/\.(jpeg|jpg|gif|png|webp|bmp|svg)$/i.test(u.pathname)) return false
    return true
  } catch {
    return false
  }
}

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

  const [errors, setErrors] = useState<Record<string, string>>({})

  function setField(name: keyof typeof formData, value: string) {
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => {
        const { [name]: _omit, ...rest } = prev
        return rest
      })
    }
  }

  function validateRequired() {
    const e: Record<string, string> = {}
    if (!formData.VC_CharityDesc.trim()) e.VC_CharityDesc = 'Charity name is required.'
    if (!formData.VC_ContactFirstName.trim()) e.VC_ContactFirstName = 'First name is required.'
    if (!formData.VC_ContactLastName.trim()) e.VC_ContactLastName = 'Last name is required.'
    if (!formData.VC_ContactEmail.trim()) e.VC_ContactEmail = 'Email is required.'
    if (!formData.VC_ContactPhone.trim()) e.VC_ContactPhone = 'Phone number is required.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // Logo URL + validation states
  const [logoURL, setLogoURL] = useState('')
  const [logoSyntaxValid, setLogoSyntaxValid] = useState(true) // filename/URL pattern check
  const [logoLoads, setLogoLoads] = useState<null | boolean>(null) // confirms it actually loads
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
      setLogoSyntaxValid(!bannerUrl || isValidImageUrl(bannerUrl))
      setLogoLoads(bannerUrl ? null : true) // empty is fine
    }
  }, [charity, bannerUrl, isEditMode])

  // Debounced image load verification when logoURL changes
  const debounceRef = useRef<number | null>(null)
  useEffect(() => {
    // Empty is allowed: treat as valid (just no banner upsert)
    if (!logoURL.trim()) {
      setLogoSyntaxValid(true)
      setLogoLoads(true)
      return
    }

    const syntaxOk = isValidImageUrl(logoURL)
    setLogoSyntaxValid(syntaxOk)
    setLogoLoads(null)

    if (!syntaxOk) return

    // Debounce actual load check
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => {
      const img = new Image()
      const cacheBust = `${logoURL}${logoURL.includes('?') ? '&' : '?'}cb=${Date.now()}`
      img.onload = () => setLogoLoads(true)
      img.onerror = () => setLogoLoads(false)
      img.src = cacheBust
    }, 300)
  }, [logoURL])

  const logoErrorMsg = useMemo(() => {
    if (!logoURL.trim()) return '' // optional
    if (!logoSyntaxValid) return 'Please enter a valid image URL ending in .jpg, .png, .webp, .svg, etc.'
    if (logoLoads === false) return 'We could not load this image. Please check the URL or try another.'
    return ''
  }, [logoURL, logoSyntaxValid, logoLoads])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateRequired()) {
      // optionally scroll to the first error
      document.querySelector('[aria-invalid="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    // Block submit if logo URL present but invalid
    if (logoURL.trim() && (!logoSyntaxValid || logoLoads === false)) {
      alert('Logo link is invalid or not reachable.')
      return
    }

    const token = await getTokenFromSession(session)
    if (!token) {
      alert('Your session has expired. Please sign in again.')
      return
    }

    try {
      let charityId = Guid_CharityId

      // Create (minimal fields) if new
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

      // Update full details
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Charities/${charityId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      // Create/update banner only if URL provided and valid
      if (logoURL.trim()) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Banner`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            Guid_Id: charityId,
            Int_BannerType: 1,
            VC_BannerLocation: logoURL.trim(),
          }),
        })
      }

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
                  onChange={(e) => setField('VC_CharityDesc', e.target.value)}
                  autoComplete="charity-name"
                  required
                  aria-invalid={!!errors.VC_CharityDesc}
                  className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 sm:text-sm/6 ${
                    errors.VC_CharityDesc
                      ? 'outline-red-400 focus:outline-red-500'
                      : 'outline-gray-300 focus:outline-indigo-600'
                  }`}
                />
                {errors.VC_CharityDesc && <p className="mt-1 text-xs text-red-600">{errors.VC_CharityDesc}</p>}
              </div>
            </div>

            <div className="sm:col-span-4">
              <label htmlFor="charity-logo" className="block text-sm/6 font-medium text-gray-900">
                Charity Logo Link (Image URL)
              </label>
              <div className="mt-2">
                <input
                  id="charity-logo"
                  name="charity-logo"
                  type="url"
                  value={logoURL}
                  onChange={(e) => setLogoURL(e.target.value)} // ✅ fixed
                  autoComplete="url"
                  placeholder="https://example.com/logo.png"
                  aria-invalid={!!logoErrorMsg}
                  className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 sm:text-sm/6 ${logoErrorMsg ? 'outline-red-400 focus:outline-red-500' : 'outline-gray-300 focus:outline-indigo-600'} `}
                />
                {logoErrorMsg && <p className="mt-1 text-xs text-red-600">{logoErrorMsg}</p>}

                {/* Tiny preview when valid & provided */}
                {logoURL.trim() && logoSyntaxValid && logoLoads && (
                  <div className="mt-3">
                    <img
                      src={logoURL}
                      alt="Charity logo preview"
                      className="h-16 w-auto rounded border border-gray-200 object-contain p-1"
                    />
                  </div>
                )}
              </div>
            </div>

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
          <h2 className="text-base/7 font-semibold text-gray-900">Contact Information</h2>
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
                  onChange={(e) => setField('VC_ContactFirstName', e.target.value)}
                  required
                  type="text"
                  autoComplete="given-name"
                  aria-invalid={!!errors.VC_ContactFirstName}
                  className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 sm:text-sm/6 ${
                    errors.VC_ContactFirstName
                      ? 'outline-red-400 focus:outline-red-500'
                      : 'outline-gray-300 focus:outline-indigo-600'
                  }`}
                />
                {errors.VC_ContactFirstName && <p className="mt-1 text-xs text-red-600">{errors.VC_ContactFirstName}</p>}
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
                  onChange={(e) => setField('VC_ContactLastName', e.target.value)}
                  type="text"
                  required
                  aria-invalid={!!errors.VC_ContactLastName}
                  autoComplete="family-name"
                  className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 sm:text-sm/6 ${
                    errors.VC_ContactLastName ? 'outline-red-400 focus:outline-red-500' : 'outline-gray-300 focus:outline-indigo-600'
                  }`}
                />
                {errors.VC_ContactLastName && <p className="mt-1 text-xs text-red-600">{errors.VC_ContactLastName}</p>}
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
                  onChange={(e) => setField('VC_ContactEmail', e.target.value)}
                  type="email"
                  required
                  aria-invalid={!!errors.VC_ContactEmail}
                  autoComplete="email"
                  className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 sm:text-sm/6 ${
                    errors.VC_ContactEmail ? 'outline-red-400 focus:outline-red-500' : 'outline-gray-300 focus:outline-indigo-600'
                  }`}
                />
                {errors.VC_ContactEmail && <p className="mt-1 text-xs text-red-600">{errors.VC_ContactEmail}</p>}
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
                  onChange={(e) => setField('VC_ContactPhone', e.target.value)}
                  type="tel"
                  required
                  aria-invalid={!!errors.VC_ContactPhone}
                  autoComplete="tel"
                  className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 sm:text-sm/6 ${
                    errors.VC_ContactPhone ? 'outline-red-400 focus:outline-red-500' : 'outline-gray-300 focus:outline-indigo-600'
                  }`}
                />
                {errors.VC_ContactPhone && <p className="mt-1 text-xs text-red-600">{errors.VC_ContactPhone}</p>}
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
