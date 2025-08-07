// components/raffle/RaffleDetailsStep.tsx
'use client'

import { useState } from 'react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

const isValidImageUrl = (url: string) => {
  try {
    new URL(url)
    return /\.(jpeg|jpg|gif|png|webp|bmp|svg)$/i.test(url)
  } catch {
    return false
  }
}

export default function RaffleDetailsStep({
  licenseNo,
  setLicenseNo,
  raffleName,
  setRaffleName,
  raffleLocation,
  setRaffleLocation,
  raffleDescription,
  setRaffleDescription,
  raffleRules,
  setRaffleRules,
  salesStartDate,
  setSalesStartDate,
  salesEndDate,
  setSalesEndDate,
  bannerLink,
  setBannerLink,
}: any) {
  const [isValidBannerLink, setIsValidBannerLink] = useState(true)

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Raffle Details</h2>

      <label className="mb-1 block text-sm font-medium text-gray-700">License Number</label>
      <input
        type="text"
        value={licenseNo}
        onChange={(e) => setLicenseNo(e.target.value)}
        placeholder="License Number"
        className="mb-4 block w-full rounded-md border p-2"
      />

      <label className="mb-1 block text-sm font-medium text-gray-700">Raffle Name</label>
      <input
        type="text"
        value={raffleName}
        onChange={(e) => setRaffleName(e.target.value)}
        placeholder="Raffle Name"
        className="mb-4 block w-full rounded-md border p-2"
      />

      <label className="mb-1 block text-sm font-medium text-gray-700">Raffle Location</label>
      <input
        type="text"
        value={raffleLocation}
        onChange={(e) => setRaffleLocation(e.target.value)}
        placeholder="Raffle Location"
        className="mb-4 block w-full rounded-md border p-2"
      />

      <label className="mt-2 mb-1 block text-sm font-medium text-gray-700">Raffle Description</label>
      <ReactQuill
        theme="snow"
        value={raffleDescription}
        onChange={setRaffleDescription}
        placeholder="Write a description for your raffle..."
      />

      <label className="mt-4 mb-1 block text-sm font-medium text-gray-700">Raffle Rules</label>
      <ReactQuill
        theme="snow"
        value={raffleRules}
        onChange={setRaffleRules}
        placeholder="Write the rules for your raffle..."
      />

      <label className="mt-4 mb-1 block text-sm font-medium text-gray-700">Ticket Sales Start Date</label>
      <input
        type="datetime-local"
        value={salesStartDate}
        onChange={(e) => {
          const inputDate = new Date(e.target.value)
          const now = new Date()

          if (inputDate <= now) {
            alert('Start date/time must be in the future.')
            return
          }

          setSalesStartDate(e.target.value)
        }}
        min={new Date().toISOString().slice(0, 16)}
        className="mb-4 block w-full rounded-md border p-2"
      />

      <label className="mb-1 block text-sm font-medium text-gray-700">Ticket Sales End Date</label>
      <input
        type="datetime-local"
        value={salesEndDate}
        onChange={(e) => {
          const inputDate = new Date(e.target.value)
          const start = new Date(salesStartDate)

          if (inputDate <= start) {
            alert('End date/time must be after the start date.')
            return
          }

          setSalesEndDate(e.target.value)
        }}
        min={salesStartDate || new Date().toISOString().slice(0, 16)}
        className="mb-4 block w-full rounded-md border p-2"
      />

      <label className="mb-1 block text-sm font-medium text-gray-700">Banner Link (Image URL)</label>
      <input
        type="text"
        value={bannerLink}
        onChange={(e) => {
          const val = e.target.value
          setBannerLink(val)
          setIsValidBannerLink(isValidImageUrl(val))
        }}
        placeholder="https://example.com/banner.jpg"
        className="block w-full rounded-md border p-2"
      />
      {!isValidBannerLink && bannerLink && (
        <p className="mt-1 text-sm text-red-600">
          Please enter a valid image URL ending in .jpg, .png, etc. Also make sure the url is correct.
        </p>
      )}

      {isValidBannerLink && bannerLink && (
        <div className="mt-4">
          <p className="mb-1 text-sm text-gray-500">Image Preview:</p>
          <img
            src={bannerLink}
            alt="Banner preview"
            className="max-h-48 w-auto rounded-md border border-gray-300"
            onError={() => setIsValidBannerLink(false)}
          />
        </div>
      )}
    </div>
  )
}
