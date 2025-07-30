// components/Raffle/RaffleInfoTab.tsx
'use client'

import { format } from 'date-fns'
import { ShowMore } from '@re-dev/react-truncate'

type Props = {
  raffle: any
  prizes: any[]
  buyIns: any[]
}

export function RaffleInfoTab({ raffle, prizes, buyIns }: Props) {
  return (
    <div className="text-sm text-gray-500 space-y-8">
      {/* Game Details */}
      <section>
        <h3 className="text-base/7 font-semibold text-gray-900">Game Details</h3>
        <div className="mt-2 prose prose-sm max-w-none">
          <ShowMore lines={3}>
            <div dangerouslySetInnerHTML={{ __html: raffle.Txt_GameDetails || 'No game details available.' }} />
          </ShowMore>
        </div>
      </section>

      {/* Game Rules */}
      <section>
        <h3 className="text-base/7 font-semibold text-gray-900">Game Rules</h3>
        <div className="mt-2 prose prose-sm max-w-none">
          <ShowMore lines={3}>
            <div dangerouslySetInnerHTML={{ __html: raffle.Txt_GameRules || 'No game rules available.' }} />
          </ShowMore>
        </div>
      </section>

      {/* Prizes Table */}
      <section>
        <h3 className="text-base/7 font-semibold text-gray-900">Prize Details</h3>
        <div className="overflow-x-auto mt-2">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Description</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Value</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Draw Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Winner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {prizes.map((prize) => (
                <tr key={prize.Guid_PrizeId}>
                  <td className="px-4 py-3 text-sm text-gray-900">{prize.VC_Description}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">${prize.Dec_Value}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {prize.Dt_Draw && prize.Dt_Draw !== '0000-00-00 00:00:00'
                      ? format(new Date(prize.Dt_Draw), 'MMMM d, yyyy')
                      : 'TBD'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {!prize.Guid_TicketId || prize.Guid_TicketId === 'null'
                      ? 'No Winner Selected'
                      : prize.Guid_TicketId}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Ticket Bundles Table */}
      <section>
        <h3 className="text-base/7 font-semibold text-gray-900">Ticket Bundles</h3>
        <div className="overflow-x-auto mt-2">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Description</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Number of Tickets</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {buyIns.map((buyIn) => (
                <tr key={buyIn.Guid_BuyInId}>
                  <td className="px-4 py-3 text-sm text-gray-900">{buyIn.VC_Description}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{buyIn.Int_NumbTicket}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">${buyIn.Dec_Price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}