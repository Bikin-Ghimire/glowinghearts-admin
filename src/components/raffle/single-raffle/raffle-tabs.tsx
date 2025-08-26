// components/Raffle/RaffleTabs.tsx
'use client'

import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'
import { RaffleSalesTab } from './raffle-sales-tab'
import { RaffleInfoTab } from './raffle-info-tab'
import { RaffleChangeLogsTab } from './raffle-change-logs'
import { RaffleTicketLogsTab } from './raffle-ticket-logs'
import { RafflePrizeLogsTab } from './raffle-prize-logs'
import { RaffleBuyInLogsTab } from './raffle-buyins-logs'

type Props = {
  raffle: any
  purchases: any[]
  logs: any[]
  prizes: any[]
  buyIns: any[]
  ticketLogs: any[]
  prizeLogs: any[]
  buyInLogs: any[]
}

export function RaffleTabs({ raffle, purchases, prizes, buyIns, logs, ticketLogs, prizeLogs, buyInLogs }: Props) {
  return (
    <div className="mt-8 text-zinc-900 dark:text-zinc-100">
      <TabGroup>
        {/* Tab headers */}
        <div className="border-b border-zinc-200 dark:border-zinc-700">
          <TabList className="-mb-px flex flex-wrap gap-6">
            <Tab
              className="inline-flex items-center gap-2 border-b-2 border-transparent py-3 text-sm font-medium
                         text-zinc-600 hover:border-zinc-300 hover:text-zinc-900
                         focus:outline-none data-[selected]:border-indigo-600 data-[selected]:text-indigo-600
                         dark:text-zinc-300 dark:hover:text-zinc-100 dark:data-[selected]:text-indigo-400
                         focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
                         dark:focus-visible:ring-offset-zinc-900 rounded-sm"
            >
              Raffle Information
            </Tab>
            <Tab
              className="inline-flex items-center gap-2 border-b-2 border-transparent py-3 text-sm font-medium
                         text-zinc-600 hover:border-zinc-300 hover:text-zinc-900
                         focus:outline-none data-[selected]:border-indigo-600 data-[selected]:text-indigo-600
                         dark:text-zinc-300 dark:hover:text-zinc-100 dark:data-[selected]:text-indigo-400
                         focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
                         dark:focus-visible:ring-offset-zinc-900 rounded-sm"
            >
              Sales Information
            </Tab>
            <Tab
              className="inline-flex items-center gap-2 border-b-2 border-transparent py-3 text-sm font-medium
                         text-zinc-600 hover:border-zinc-300 hover:text-zinc-900
                         focus:outline-none data-[selected]:border-indigo-600 data-[selected]:text-indigo-600
                         dark:text-zinc-300 dark:hover:text-zinc-100 dark:data-[selected]:text-indigo-400
                         focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
                         dark:focus-visible:ring-offset-zinc-900 rounded-sm"
            >
              Change Logs
            </Tab>
            <Tab
              className="inline-flex items-center gap-2 border-b-2 border-transparent py-3 text-sm font-medium
                         text-zinc-600 hover:border-zinc-300 hover:text-zinc-900
                         focus:outline-none data-[selected]:border-indigo-600 data-[selected]:text-indigo-600
                         dark:text-zinc-300 dark:hover:text-zinc-100 dark:data-[selected]:text-indigo-400
                         focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
                         dark:focus-visible:ring-offset-zinc-900 rounded-sm"
            >
              Ticket Logs
            </Tab>
            <Tab
              className="inline-flex items-center gap-2 border-b-2 border-transparent py-3 text-sm font-medium
                         text-zinc-600 hover:border-zinc-300 hover:text-zinc-900
                         focus:outline-none data-[selected]:border-indigo-600 data-[selected]:text-indigo-600
                         dark:text-zinc-300 dark:hover:text-zinc-100 dark:data-[selected]:text-indigo-400
                         focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
                         dark:focus-visible:ring-offset-zinc-900 rounded-sm"
            >
              Prize Logs
            </Tab>
            <Tab
              className="inline-flex items-center gap-2 border-b-2 border-transparent py-3 text-sm font-medium
                         text-zinc-600 hover:border-zinc-300 hover:text-zinc-900
                         focus:outline-none data-[selected]:border-indigo-600 data-[selected]:text-indigo-600
                         dark:text-zinc-300 dark:hover:text-zinc-100 dark:data-[selected]:text-indigo-400
                         focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
                         dark:focus-visible:ring-offset-zinc-900 rounded-sm"
            >
              Bundle Logs
            </Tab>
          </TabList>
        </div>

        {/* Panels */}
        <TabPanels className="pt-4">
          <TabPanel className="focus:outline-none">
            <RaffleInfoTab raffle={raffle} prizes={prizes} buyIns={buyIns} />
          </TabPanel>
          <TabPanel className="focus:outline-none">
            <RaffleSalesTab purchases={purchases} raffleId={raffle.Guid_RaffleId} />
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