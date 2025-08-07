// components/raffle/ReviewStep.tsx
'use client'

export default function ReviewStep({
  licenseNo,
  raffleName,
  raffleLocation,
  salesStartDate,
  salesEndDate,
  bannerLink,
  raffleDescription,
  raffleRules,
  prizes,
  bundles,
}: any) {
  const prizeTypeMap: Record<number, string> = {
    1: '50/50 Cash',
    2: 'Early Bird',
    3: 'Prize Raffle',
  }
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Review & Publish</h2>

      <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-medium text-gray-700">Raffle Details</h3>
        <p>
          <strong>License No:</strong> {licenseNo}
        </p>
        <p>
          <strong>Raffle Name:</strong> {raffleName}
        </p>
        <p>
          <strong>Location:</strong> {raffleLocation}
        </p>
        <p>
          <strong>Sales Period:</strong> {new Date(salesStartDate).toISOString().replace('T', ' ').slice(0, 19)} to{' '}
          {new Date(salesEndDate).toISOString().replace('T', ' ').slice(0, 19)}
        </p>
        <p>
          <strong>Banner:</strong>{' '}
          <a className="text-blue-600 underline" href={bannerLink} target="_blank" rel="noopener noreferrer">
            {bannerLink}
          </a>
        </p>
      </div>

      <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-medium text-gray-700">Raffle Description</h3>
        <article className="prose prose-sm max-w-none">
          <div dangerouslySetInnerHTML={{ __html: raffleDescription }} />
        </article>
      </div>

      <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-medium text-gray-700">Raffle Rules</h3>
        <article className="prose prose-sm max-w-none">
          <div dangerouslySetInnerHTML={{ __html: raffleRules }} />
        </article>
      </div>

      <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-medium text-gray-700">Prizes</h3>
        {prizes.map((prize: any, idx: number) => (
          <div key={idx} className="text-sm text-gray-800">
            <p>
              <strong>Prize {idx + 1}</strong>
            </p>
            <p>Type: {prizeTypeMap[prize.type] || 'Unknown'}</p>
            <p>Name: {prize.name}</p>
            <p>
              Amount: {prize.amount}
              {prize.isPercentage ? '%' : ''}
            </p>
            <p>Draw Date: {new Date(prize.drawDate).toISOString().replace('T', ' ').slice(0, 19)}</p>
            <hr className="my-2" />
          </div>
        ))}
      </div>

      <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-medium text-gray-700">Ticket Bundles</h3>
        {bundles.map((bundle: any, idx: number) => (
          <div key={idx} className="text-sm text-gray-800">
            <p>
              <strong>Bundle {idx + 1}</strong>
            </p>
            <p>Tickets: {bundle.numberOfTickets}</p>
            <p>Price: ${bundle.price}</p>
            <p>Description: {bundle.description}</p>
            <hr className="my-2" />
          </div>
        ))}
      </div>
    </div>
  )
}
