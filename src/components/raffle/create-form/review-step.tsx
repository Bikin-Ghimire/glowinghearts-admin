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

  // (Optional) keep your original ISO view; if you want local time, swap for toLocaleString().
  const fmt = (d?: string) =>
    d ? new Date(d).toISOString().replace('T', ' ').slice(0, 19) : '—'

  return (
    <div className="space-y-6 text-zinc-900 dark:text-zinc-100">
      <h2 className="text-xl font-semibold">Review &amp; Publish</h2>

      {/* Raffle Details */}
      <div className="space-y-2 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <h3 className="mb-4 text-lg font-medium text-zinc-700 dark:text-zinc-300">Raffle Details</h3>
        <p className="text-zinc-800 dark:text-zinc-200">
          <strong className="font-semibold">License No:</strong> {licenseNo || '—'}
        </p>
        <p className="text-zinc-800 dark:text-zinc-200">
          <strong className="font-semibold">Raffle Name:</strong> {raffleName || '—'}
        </p>
        <p className="text-zinc-800 dark:text-zinc-200">
          <strong className="font-semibold">Location:</strong> {raffleLocation || '—'}
        </p>
        <p className="text-zinc-800 dark:text-zinc-200">
          <strong className="font-semibold">Sales Period:</strong> {fmt(salesStartDate)} to {fmt(salesEndDate)}
        </p>
        <p className="text-zinc-800 dark:text-zinc-200">
          <strong className="font-semibold">Banner:</strong>{' '}
          {bannerLink ? (
            <a
              className="text-blue-600 underline hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              href={bannerLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              {bannerLink}
            </a>
          ) : (
            '—'
          )}
        </p>
      </div>

      {/* Raffle Description */}
      <div className="space-y-2 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <h3 className="mb-4 text-lg font-medium text-zinc-700 dark:text-zinc-300">Raffle Description</h3>
        <article className="prose prose-sm max-w-none prose-a:text-blue-600 dark:prose-invert dark:prose-a:text-blue-400">
          <div dangerouslySetInnerHTML={{ __html: raffleDescription || '' }} />
        </article>
      </div>

      {/* Raffle Rules */}
      <div className="space-y-2 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <h3 className="mb-4 text-lg font-medium text-zinc-700 dark:text-zinc-300">Raffle Rules</h3>
        <article className="prose prose-sm max-w-none prose-a:text-blue-600 dark:prose-invert dark:prose-a:text-blue-400">
          <div dangerouslySetInnerHTML={{ __html: raffleRules || '' }} />
        </article>
      </div>

      {/* Prizes */}
      <div className="space-y-2 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <h3 className="mb-4 text-lg font-medium text-zinc-700 dark:text-zinc-300">Prizes</h3>
        {Array.isArray(prizes) && prizes.length > 0 ? (
          prizes.map((prize: any, idx: number) => (
            <div key={idx} className="text-sm text-zinc-800 dark:text-zinc-200">
              <p>
                <strong className="font-semibold">Prize {idx + 1}</strong>
              </p>
              <p>Type: {prizeTypeMap[prize?.type] || 'Unknown'}</p>
              <p>Name: {prize?.name || '—'}</p>
              <p>
                Amount: {' '}
                {Number(prize?.type) === 1
                ? '50% of Total Jackpot'
                : (prize?.amount !== undefined && prize?.amount !== '' ? prize.amount : '—')}
              </p>
              <p>Draw Date: {fmt(prize?.drawDate)}</p>
              <hr className="my-2 border-zinc-200 dark:border-zinc-700" />
            </div>
          ))
        ) : (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">No prizes added.</p>
        )}
      </div>

      {/* Bundles */}
      <div className="space-y-2 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <h3 className="mb-4 text-lg font-medium text-zinc-700 dark:text-zinc-300">Ticket Bundles</h3>
        {Array.isArray(bundles) && bundles.length > 0 ? (
          bundles.map((bundle: any, idx: number) => (
            <div key={idx} className="text-sm text-zinc-800 dark:text-zinc-200">
              <p>
                <strong className="font-semibold">Bundle {idx + 1}</strong>
              </p>
              <p>Tickets: {bundle?.numberOfTickets ?? '—'}</p>
              <p>Price: {bundle?.price !== undefined && bundle?.price !== '' ? `$${bundle.price}` : '—'}</p>
              <p>Description: {bundle?.description || '—'}</p>
              <hr className="my-2 border-zinc-200 dark:border-zinc-700" />
            </div>
          ))
        ) : (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">No bundles added.</p>
        )}
      </div>
    </div>
  )
}