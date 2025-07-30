// components/Raffle/RaffleTabs.tsx
'use client'

import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'
import { RaffleSalesTab } from './raffle-sales-tab'
import { RaffleInfoTab } from './raffle-info-tab'

type Props = {
  raffle: any
  purchases: any[]
  prizes: any[]
  buyIns: any[]
}

export function RaffleTabs({ raffle, purchases, prizes, buyIns }: Props) {
  return (
    <div className="mt-8">
      <TabGroup>
        <div className="border-b border-gray-200">
          <TabList className="-mb-px flex space-x-8">
            <Tab className="border-b-2 border-transparent py-6 text-sm font-medium whitespace-nowrap text-gray-700 hover:border-gray-300 hover:text-gray-800 data-selected:border-indigo-600 data-selected:text-indigo-600">
              Sales Information
            </Tab>
            <Tab className="border-b-2 border-transparent py-6 text-sm font-medium whitespace-nowrap text-gray-700 hover:border-gray-300 hover:text-gray-800 data-selected:border-indigo-600 data-selected:text-indigo-600">
              Raffle Information
            </Tab>
          </TabList>
        </div>
        <TabPanels>
          <TabPanel>
            <RaffleSalesTab purchases={purchases} raffleId={raffle.Guid_RaffleId} />
          </TabPanel>
          <TabPanel>
            <RaffleInfoTab raffle={raffle} prizes={prizes} buyIns={buyIns} />
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  )
}