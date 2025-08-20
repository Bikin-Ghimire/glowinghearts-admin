// components/raffle/RaffleDetailsStep.tsx
'use client'

import { useState } from 'react'
import RichTextEditorTiptap from '@/components/rich-text'

const isValidImageUrl = (url: string) => {
  try {
    const u = new URL(url)
    return /\.(jpeg|jpg|gif|png|webp|bmp|svg)$/i.test(u.pathname)
  } catch {
    return false
  }
}

interface RaffleDetailsStepProps {
  licenseNo: string
  setLicenseNo: (v: string) => void

  raffleName: string
  setRaffleName: (v: string) => void

  raffleLocation: string
  setRaffleLocation: (v: string) => void

  raffleDescription: string // HTML
  setRaffleDescription: (html: string) => void

  raffleRules: string // HTML
  setRaffleRules: (html: string) => void

  salesStartDate: string // ISO 'YYYY-MM-DDTHH:mm'
  setSalesStartDate: (v: string) => void

  salesEndDate: string // ISO 'YYYY-MM-DDTHH:mm'
  setSalesEndDate: (v: string) => void

  bannerLink: string
  setBannerLink: (v: string) => void
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
}: RaffleDetailsStepProps) {
  const [isValidBannerLink, setIsValidBannerLink] = useState(true)

  return (
    <div className="text-zinc-900 dark:text-zinc-100">
      {/* Dark mode fixes for native date/time controls (WebKit) + autofill */}
      <style jsx global>{`
        /* Invert only the calendar/time icon in dark mode (Chrome/Safari) */
        .dark input[type='date']::-webkit-calendar-picker-indicator,
        .dark input[type='time']::-webkit-calendar-picker-indicator,
        .dark input[type='datetime-local']::-webkit-calendar-picker-indicator {
          filter: invert(1) opacity(0.9);
        }
        /* Hide ugly inner spin buttons color mismatch on number-like inputs if any */
        .dark input::-webkit-inner-spin-button,
        .dark input::-webkit-outer-spin-button {
          filter: invert(1);
        }
        /* Make WebKit autofill match dark fields */
        input:-webkit-autofill {
          box-shadow: 0 0 0px 1000px transparent inset;
        }
        .dark input:-webkit-autofill {
          -webkit-text-fill-color: #e4e4e7; /* zinc-200 */
          transition: background-color 9999s ease-in-out 0s;
          caret-color: #e4e4e7;
        }
      `}</style>

      <h2 className="mb-4 text-xl font-semibold">Raffle Details</h2>

      {/* License Number */}
      <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">License Number</label>
      <input
        type="text"
        value={licenseNo}
        onChange={(e) => setLicenseNo(e.target.value)}
        placeholder="License Number"
        className="mb-4 block w-full rounded-md border border-zinc-300 bg-white p-2 text-zinc-900
                   placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-600
                   dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder-zinc-500
                   dark:[color-scheme:dark]"
      />

      {/* Raffle Name */}
      <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Raffle Name</label>
      <input
        type="text"
        value={raffleName}
        onChange={(e) => setRaffleName(e.target.value)}
        placeholder="Raffle Name"
        className="mb-4 block w-full rounded-md border border-zinc-300 bg-white p-2 text-zinc-900
                   placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-600
                   dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder-zinc-500
                   dark:[color-scheme:dark]"
      />

      {/* Raffle Location */}
      <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Raffle Location</label>
      <input
        type="text"
        value={raffleLocation}
        onChange={(e) => setRaffleLocation(e.target.value)}
        placeholder="Raffle Location"
        className="mb-4 block w-full rounded-md border border-zinc-300 bg-white p-2 text-zinc-900
                   placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-600
                   dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder-zinc-500
                   dark:[color-scheme:dark]"
      />

      {/* Raffle Description (Tiptap) */}
      <label className="mt-2 mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Raffle Description
      </label>
      <RichTextEditorTiptap
        value={raffleDescription}
        onChange={setRaffleDescription}
        placeholder="Write a description for your raffle..."
        className="mb-4"
      />

      {/* Raffle Rules (Tiptap) */}
      <label className="mt-4 mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Raffle Rules</label>
      <RichTextEditorTiptap
        value={raffleRules}
        onChange={setRaffleRules}
        placeholder="Write the rules for your raffle..."
        className="mb-4"
      />

      {/* Ticket Sales Start Date */}
      <label className="mt-4 mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Ticket Sales Start Date
      </label>
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
        className="mb-4 block w-full rounded-md border border-zinc-300 bg-white p-2 text-zinc-900
                   focus:outline-none focus:ring-2 focus:ring-indigo-600
                   dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100
                   dark:[color-scheme:dark]"
      />

      {/* Ticket Sales End Date */}
      <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Ticket Sales End Date</label>
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
        className="mb-4 block w-full rounded-md border border-zinc-300 bg-white p-2 text-zinc-900
                   focus:outline-none focus:ring-2 focus:ring-indigo-600
                   dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100
                   dark:[color-scheme:dark]"
      />

      {/* Banner Link */}
      <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Banner Link (Image URL)</label>
      <input
        type="text"
        value={bannerLink}
        onChange={(e) => {
          const val = e.target.value
          setBannerLink(val)
          setIsValidBannerLink(isValidImageUrl(val))
        }}
        placeholder="https://example.com/banner.jpg"
        className="block w-full rounded-md border border-zinc-300 bg-white p-2 text-zinc-900
                   placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-600
                   dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder-zinc-500
                   dark:[color-scheme:dark]"
      />
      {!isValidBannerLink && bannerLink && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          Please enter a valid image URL ending in .jpg, .png, etc. Also make sure the URL is correct.
        </p>
      )}

      {isValidBannerLink && bannerLink && (
        <div className="mt-4">
          <p className="mb-1 text-sm text-zinc-500 dark:text-zinc-400">Image Preview:</p>
          <img
            src={bannerLink}
            alt="Banner preview"
            className="max-h-48 w-auto rounded-md border border-zinc-300 dark:border-zinc-700"
            onError={() => setIsValidBannerLink(false)}
          />
        </div>
      )}
    </div>
  )
}