// components/raffle/RaffleDetailsStep.tsx
'use client'

import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

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

      <label className="mb-1 block text-sm font-medium text-gray-700">Raffle Name (max 250 characters)</label>
      <input
        type="text"
        maxLength={250}
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

      <label className="mb-1 mt-2 block text-sm font-medium text-gray-700">Raffle Description</label>
      <ReactQuill
        theme="snow"
        value={raffleDescription}
        onChange={setRaffleDescription}
        placeholder="Write a description for your raffle..."
      />

      <label className="mb-1 mt-4 block text-sm font-medium text-gray-700">Raffle Rules</label>
      <ReactQuill
        theme="snow"
        value={raffleRules}
        onChange={setRaffleRules}
        placeholder="Write the rules for your raffle..."
      />

      <label className="mb-1 mt-4 block text-sm font-medium text-gray-700">Ticket Sales Start Date</label>
      <input
        type="datetime-local"
        value={salesStartDate}
        onChange={(e) => setSalesStartDate(e.target.value)}
        min={new Date().toISOString().split('T')[0]}
        className="mb-4 block w-full rounded-md border p-2"
      />

      <label className="mb-1 block text-sm font-medium text-gray-700">Ticket Sales End Date</label>
      <input
        type="datetime-local"
        value={salesEndDate}
        onChange={(e) => setSalesEndDate(e.target.value)}
        min={salesStartDate || new Date().toISOString().split('T')[0]}
        className="mb-4 block w-full rounded-md border p-2"
      />

      <label className="mb-1 block text-sm font-medium text-gray-700">Banner Link (Image URL)</label>
      <input
        type="text"
        value={bannerLink}
        onChange={(e) => setBannerLink(e.target.value)}
        placeholder="https://example.com/banner.jpg"
        className="block w-full rounded-md border p-2"
      />
    </div>
  )
}
