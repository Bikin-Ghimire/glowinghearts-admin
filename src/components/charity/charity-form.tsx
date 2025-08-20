'use client'
// import 'react-quill/dist/quill.snow.css' // Quill base styles

// const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })

import RichTextEditorTiptap from '@/components/rich-text'
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
  const { data: session } = useSession()
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
  const [logoSyntaxValid, setLogoSyntaxValid] = useState(true)
  const [logoLoads, setLogoLoads] = useState<null | boolean>(null)
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
    if (!logoURL.trim()) {
      setLogoSyntaxValid(true)
      setLogoLoads(true)
      return
    }
    const syntaxOk = isValidImageUrl(logoURL)
    setLogoSyntaxValid(syntaxOk)
    setLogoLoads(null)
    if (!syntaxOk) return

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
    if (!logoURL.trim()) return ''
    if (!logoSyntaxValid) return 'Please enter a valid image URL ending in .jpg, .png, .webp, .svg, etc.'
    if (logoLoads === false) return 'We could not load this image. Please check the URL or try another.'
    return ''
  }, [logoURL, logoSyntaxValid, logoLoads])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateRequired()) {
      document.querySelector('[aria-invalid="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

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
    return <p className="text-zinc-800 dark:text-zinc-200">Loading charity...</p>
  }

  return (
    <>
      {/* Dark-mode overrides for ReactQuill Snow theme */}
      <style jsx global>{`
        .dark .ql-toolbar.ql-snow {
          border-color: #3f3f46; /* zinc-700 */
          background: #18181b; /* zinc-900-ish */
          color: #e4e4e7; /* zinc-200 */
        }
        .dark .ql-toolbar.ql-snow .ql-picker,
        .dark .ql-toolbar.ql-snow .ql-stroke,
        .dark .ql-toolbar.ql-snow .ql-fill,
        .dark .ql-toolbar.ql-snow .ql-picker-label {
          color: #e4e4e7 !important;
          stroke: #e4e4e7 !important;
          fill: #e4e4e7 !important;
        }
        .dark .ql-container.ql-snow {
          border-color: #3f3f46; /* zinc-700 */
        }
        .dark .ql-editor {
          background: #0a0a0a; /* zinc-950 */
          color: #f4f4f5; /* zinc-100 */
        }
        .dark .ql-editor.ql-blank::before {
          color: #a1a1aa; /* zinc-400 */
        }
      `}</style>

      <form onSubmit={handleSubmit} className="text-zinc-900 dark:text-zinc-100">
        <div className="space-y-12">
          <div className="border-b border-zinc-200 pb-12 dark:border-zinc-700">
            <h1 className="mb-10 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {isEditMode ? 'Edit Charity' : 'Create a Charity'}
            </h1>

            <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
              {/* Charity Name */}
              <div className="sm:col-span-4">
                <label htmlFor="charity-name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
                    className={`block w-full rounded-md border bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 ring-1 outline-none ring-inset focus:ring-2 focus:ring-inset sm:text-sm dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder-zinc-500 ${
                      errors.VC_CharityDesc
                        ? 'border-red-400 ring-red-400 focus:ring-red-500'
                        : 'border-zinc-300 ring-zinc-300 focus:ring-indigo-600 dark:border-zinc-700 dark:ring-zinc-700 dark:focus:ring-indigo-500'
                    }`}
                  />
                  {errors.VC_CharityDesc && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.VC_CharityDesc}</p>
                  )}
                </div>
              </div>

              {/* Logo URL */}
              <div className="sm:col-span-4">
                <label htmlFor="charity-logo" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Charity Logo Link (Image URL)
                </label>
                <div className="mt-2">
                  <input
                    id="charity-logo"
                    name="charity-logo"
                    type="url"
                    value={logoURL}
                    onChange={(e) => setLogoURL(e.target.value)}
                    autoComplete="url"
                    placeholder="https://example.com/logo.png"
                    aria-invalid={!!logoErrorMsg}
                    className={`block w-full rounded-md border bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 ring-1 outline-none ring-inset focus:ring-2 focus:ring-inset sm:text-sm dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder-zinc-500 ${
                      logoErrorMsg
                        ? 'border-red-400 ring-red-400 focus:ring-red-500'
                        : 'border-zinc-300 ring-zinc-300 focus:ring-indigo-600 dark:border-zinc-700 dark:ring-zinc-700 dark:focus:ring-indigo-500'
                    }`}
                  />
                  {logoErrorMsg && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{logoErrorMsg}</p>}

                  {/* Tiny preview when valid & provided */}
                  {logoURL.trim() && logoSyntaxValid && logoLoads && (
                    <div className="mt-3">
                      <img
                        src={logoURL}
                        alt="Charity logo preview"
                        className="h-16 w-auto rounded border border-zinc-200 object-contain p-1 dark:border-zinc-700"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Description (Quill) */}
              {/* <div className="sm:col-span-6">
                <label htmlFor="charity-description" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
              </div> */}

              <div className="sm:col-span-6">
                <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Charity Description
                </label>
                <RichTextEditorTiptap
                  value={formData.Txt_CharityDesc}
                  onChange={(html) => setFormData({ ...formData, Txt_CharityDesc: html })}
                  placeholder="Write a description for your charity..."
                  className="mt-2"
                />
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="border-b border-zinc-200 pb-12 dark:border-zinc-700">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Contact Information</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Add details of one direct contact for the charity.
            </p>

            <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
              {/* First name */}
              <div className="sm:col-span-3">
                <label htmlFor="first-name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
                    className={`block w-full rounded-md border bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 ring-1 outline-none ring-inset focus:ring-2 focus:ring-inset sm:text-sm dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder-zinc-500 ${
                      errors.VC_ContactFirstName
                        ? 'border-red-400 ring-red-400 focus:ring-red-500'
                        : 'border-zinc-300 ring-zinc-300 focus:ring-indigo-600 dark:border-zinc-700 dark:ring-zinc-700 dark:focus:ring-indigo-500'
                    }`}
                  />
                  {errors.VC_ContactFirstName && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.VC_ContactFirstName}</p>
                  )}
                </div>
              </div>

              {/* Last name */}
              <div className="sm:col-span-3">
                <label htmlFor="last-name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
                    className={`block w-full rounded-md border bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 ring-1 outline-none ring-inset focus:ring-2 focus:ring-inset sm:text-sm dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder-zinc-500 ${
                      errors.VC_ContactLastName
                        ? 'border-red-400 ring-red-400 focus:ring-red-500'
                        : 'border-zinc-300 ring-zinc-300 focus:ring-indigo-600 dark:border-zinc-700 dark:ring-zinc-700 dark:focus:ring-indigo-500'
                    }`}
                  />
                  {errors.VC_ContactLastName && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.VC_ContactLastName}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="sm:col-span-3">
                <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
                    className={`block w-full rounded-md border bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 ring-1 outline-none ring-inset focus:ring-2 focus:ring-inset sm:text-sm dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder-zinc-500 ${
                      errors.VC_ContactEmail
                        ? 'border-red-400 ring-red-400 focus:ring-red-500'
                        : 'border-zinc-300 ring-zinc-300 focus:ring-indigo-600 dark:border-zinc-700 dark:ring-zinc-700 dark:focus:ring-indigo-500'
                    }`}
                  />
                  {errors.VC_ContactEmail && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.VC_ContactEmail}</p>
                  )}
                </div>
              </div>

              {/* Phone */}
              <div className="sm:col-span-3">
                <label htmlFor="phone" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
                    className={`block w-full rounded-md border bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 ring-1 outline-none ring-inset focus:ring-2 focus:ring-inset sm:text-sm dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder-zinc-500 ${
                      errors.VC_ContactPhone
                        ? 'border-red-400 ring-red-400 focus:ring-red-500'
                        : 'border-zinc-300 ring-zinc-300 focus:ring-indigo-600 dark:border-zinc-700 dark:ring-zinc-700 dark:focus:ring-indigo-500'
                    }`}
                  />
                  {errors.VC_ContactPhone && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.VC_ContactPhone}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-x-6">
          <button
            type="button"
            onClick={() => router.push('/charities')}
            className="text-sm font-semibold text-zinc-900 hover:text-zinc-700 dark:text-zinc-100 dark:hover:text-zinc-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Save
          </button>
        </div>

        {/* Success Dialog */}
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
            <Dialog.Panel className="mx-auto max-w-sm rounded-lg border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
              <Dialog.Title className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                {isEditMode ? 'Charity Updated' : 'Charity Created'}
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Your charity details were successfully saved.
              </Dialog.Description>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    setShowSuccess(false)
                    router.push('/charities/' + createdCharityId)
                  }}
                  className="rounded bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  OK
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </form>
    </>
  )
}
