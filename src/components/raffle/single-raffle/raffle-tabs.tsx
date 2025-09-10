// components/Raffle/RaffleTabs.tsx
'use client'

import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'
import { RaffleSalesTab } from './raffle-sales-tab'
import { RaffleInfoTab } from './raffle-info-tab'
import { RaffleChangeLogsTab } from './raffle-change-logs'
import { RaffleTicketLogsTab } from './raffle-ticket-logs'
import { RafflePrizeLogsTab } from './raffle-prize-logs'
import { RaffleBuyInLogsTab } from './raffle-buyins-logs'
import { RaffleRefundsTab } from './raffle-refunds-tab'
import React from 'react'
import { useSession } from 'next-auth/react'
import { fetchRaffleDetail } from '@/lib/raffles'   // ← your file shown above

type Props = {
  raffle: any
  purchases: any[]
  logs: any[]
  prizes: any[]
  buyIns: any[]
  ticketLogs: any[]
  prizeLogs: any[]
  buyInLogs: any[]
  refunds: any[]
}

export function RaffleTabs({
  raffle,
  purchases: initialPurchases,
  prizes,
  buyIns,
  logs,
  ticketLogs,
  prizeLogs,
  buyInLogs,
  refunds: initialRefunds,
}: Props) {
  const { data: session } = useSession()
  const raffleId = raffle?.Guid_RaffleId

  // local copies so children can update live
  const [purchases, setPurchases] = React.useState(initialPurchases)
  const [refunds, setRefunds] = React.useState(initialRefunds)
  const [reloading, setReloading] = React.useState(false)

  const refreshAll = React.useCallback(async () => {
    if (!session || !raffleId) return
    setReloading(true)
    try {
      const fresh = await fetchRaffleDetail(session, raffleId)
      // update only the slices we need for now
      setPurchases(fresh.purchases)
      setRefunds(fresh.refunds)
      // If you want live logs too:
      // setTicketLogs(fresh.ticketLogs); setPrizeLogs(fresh.prizeLogs); setBuyInLogs(fresh.buyInLogs)
    } finally {
      setReloading(false)
    }
  }, [session, raffleId])

  return (
    <div className="mt-8 text-zinc-900 dark:text-zinc-100">
      <TabGroup>
        {/* Tab headers */}
        <div className="border-b border-zinc-200 dark:border-zinc-700">
          <TabList className="-mb-px flex flex-wrap items-center gap-6">
            <Tab className="inline-flex items-center gap-2 border-b-2 border-transparent py-3 text-sm font-medium
                           text-zinc-600 hover:border-zinc-300 hover:text-zinc-900
                           focus:outline-none data-[selected]:border-indigo-600 data-[selected]:text-indigo-600
                           dark:text-zinc-300 dark:hover:text-zinc-100 dark:data-[selected]:text-indigo-400
                           focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
                           dark:focus-visible:ring-offset-zinc-900 rounded-sm">
              Raffle Information
            </Tab>
            <Tab className="inline-flex items-center gap-2 border-b-2 border-transparent py-3 text-sm font-medium
                           text-zinc-600 hover:border-zinc-300 hover:text-zinc-900
                           focus:outline-none data-[selected]:border-indigo-600 data-[selected]:text-indigo-600
                           dark:text-zinc-300 dark:hover:text-zinc-100 dark:data-[selected]:text-indigo-400
                           focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
                           dark:focus-visible:ring-offset-zinc-900 rounded-sm">
              Sales Information
            </Tab>
            <Tab className="inline-flex items-center gap-2 border-b-2 border-transparent py-3 text-sm font-medium
                           text-zinc-600 hover:border-zinc-300 hover:text-zinc-900
                           focus:outline-none data-[selected]:border-indigo-600 data-[selected]:text-indigo-600
                           dark:text-zinc-300 dark:hover:text-zinc-100 dark:data-[selected]:text-indigo-400
                           focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
                           dark:focus-visible:ring-offset-zinc-900 rounded-sm">
              Refunded Transactions
            </Tab>
            <Tab className="inline-flex items-center gap-2 border-b-2 border-transparent py-3 text-sm font-medium
                           text-zinc-600 hover:border-zinc-300 hover:text-zinc-900
                           focus:outline-none data-[selected]:border-indigo-600 data-[selected]:text-indigo-600
                           dark:text-zinc-300 dark:hover:text-zinc-100 dark:data-[selected]:text-indigo-400
                           focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
                           dark:focus-visible:ring-offset-zinc-900 rounded-sm">
              Change Logs
            </Tab>
            <Tab className="inline-flex items-center gap-2 border-b-2 border-transparent py-3 text-sm font-medium
                           text-zinc-600 hover:border-zinc-300 hover:text-zinc-900
                           focus:outline-none data-[selected]:border-indigo-600 data-[selected]:text-indigo-600
                           dark:text-zinc-300 dark:hover:text-zinc-100 dark:data-[selected]:text-indigo-400
                           focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
                           dark:focus-visible:ring-offset-zinc-900 rounded-sm">
              Ticket Logs
            </Tab>
            <Tab className="inline-flex items-center gap-2 border-b-2 border-transparent py-3 text-sm font-medium
                           text-zinc-600 hover:border-zinc-300 hover:text-zinc-900
                           focus:outline-none data-[selected]:border-indigo-600 data-[selected]:text-indigo-600
                           dark:text-zinc-300 dark:hover:text-zinc-100 dark:data-[selected]:text-indigo-400
                           focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
                           dark:focus-visible:ring-offset-zinc-900 rounded-sm">
              Prize Logs
            </Tab>
            <Tab className="inline-flex items-center gap-2 border-b-2 border-transparent py-3 text-sm font-medium
                           text-zinc-600 hover:border-zinc-300 hover:text-zinc-900
                           focus:outline-none data-[selected]:border-indigo-600 data-[selected]:text-indigo-600
                           dark:text-zinc-300 dark:hover:text-zinc-100 dark:data-[selected]:text-indigo-400
                           focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
                           dark:focus-visible:ring-offset-zinc-900 rounded-sm">
              Bundle Logs
            </Tab>

            <div className="ml-auto pr-2 text-xs text-zinc-500 dark:text-zinc-400">
              {reloading ? 'Refreshing…' : null}
            </div>
          </TabList>
        </div>

        {/* Panels */}
        <TabPanels className="pt-4">
          <TabPanel className="focus:outline-none">
            <RaffleInfoTab raffle={raffle} prizes={prizes} buyIns={buyIns} />
          </TabPanel>

          <TabPanel className="focus:outline-none">
            <RaffleSalesTab
              purchases={purchases}
              raffleId={raffleId}
              onDataChanged={refreshAll}   // ← after refund completes, reload purchases + refunds
            />
          </TabPanel>

          <TabPanel className="focus:outline-none">
            <RaffleRefundsTab refunds={refunds} />
          </TabPanel>

          <TabPanel className="focus:outline-none">
            <RaffleChangeLogsTab logs={logs} />
          </TabPanel>
          <TabPanel className="focus:outline-none">
            <RaffleTicketLogsTab logs={ticketLogs} />
          </TabPanel>
          <TabPanel className="focus:outline-none">
            <RafflePrizeLogsTab logs={prizeLogs} />
          </TabPanel>
          <TabPanel className="focus:outline-none">
            <RaffleBuyInLogsTab logs={buyInLogs} />
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  )
}