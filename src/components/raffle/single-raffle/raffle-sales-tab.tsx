// components/Raffle/RaffleSalesTab.tsx
'use client'

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
  createColumnHelper,
  getExpandedRowModel,
} from '@tanstack/react-table'
import { format } from 'date-fns'
import { useState } from 'react'
import React from 'react'

type Package = {
  Int_Package: number
  VC_Description: string
  Int_NumbTicket: number
  Dec_Price: number
  obj_Tickets: string[]
}

type Purchase = {
  Guid_PurchaseId: string
  Int_TotalTickets: number
  Dec_TotalPrice: number
  Dt_Purchased: string
  obj_Packages: Package[]
}

type Props = {
  purchases: Purchase[]
  raffleId: string
}

const columnHelper = createColumnHelper<Purchase>()

export function RaffleSalesTab({ purchases }: Props) {
  const [expanded, setExpanded] = useState({})

  const columns: ColumnDef<Purchase, any>[] = [
    columnHelper.accessor('Guid_PurchaseId', {
      header: 'Purchase ID',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('Dec_TotalPrice', {
      header: 'Amount Paid',
      cell: (info) => {
        const val = Number(info.getValue())
        return isNaN(val) ? info.getValue() : `$${val.toFixed(2)}`
      },
    }),
    columnHelper.accessor('Int_TotalTickets', {
      header: 'Tickets Purchased',
    }),
    columnHelper.accessor('Dt_Purchased', {
      header: 'Purchase Date',
      cell: (info) =>
        info.getValue() && info.getValue() !== '0000-00-00 00:00:00'
          ? format(new Date(info.getValue()), 'MMMM d, yyyy, h:mm a')
          : 'TBD',
    }),
  ]

  const table = useReactTable({
    data: purchases,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    state: { expanded },
    onExpandedChange: setExpanded,
    getRowCanExpand: () => true,
  })

  return (
    <div className="overflow-x-auto rounded border border-zinc-200 shadow-sm dark:border-zinc-700">
      <table className="min-w-[1200px] text-left text-sm text-zinc-900 dark:text-zinc-100">
        {/* Header */}
        <thead className="sticky top-0 z-10 bg-zinc-50 dark:bg-zinc-800">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-zinc-200 dark:border-zinc-700">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="whitespace-nowrap px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100"
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>

        {/* Body */}
        <tbody className="divide-y divide-zinc-100 bg-white dark:divide-zinc-800 dark:bg-zinc-900">
          {table.getRowModel().rows.map((row) => (
            <React.Fragment key={row.id}>
              <tr
                className="cursor-pointer hover:bg-zinc-50 focus-within:bg-zinc-50 dark:hover:bg-zinc-800 dark:focus-within:bg-zinc-800"
                onClick={() => row.toggleExpanded()}
                aria-expanded={row.getIsExpanded()}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    row.toggleExpanded()
                  }
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-2 align-top">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>

              {row.getIsExpanded() && (
                <tr className="border-t border-zinc-200 dark:border-zinc-700">
                  <td colSpan={columns.length} className="bg-zinc-50 px-6 py-4 dark:bg-zinc-800/60">
                    <div className="space-y-4">
                      {row.original.obj_Packages.map((pkg, idx) => (
                        <div
                          key={idx}
                          className="rounded border border-zinc-200 p-4 dark:border-zinc-700 dark:bg-zinc-900/50"
                        >
                          <div className="mb-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                            {pkg.VC_Description} – ${Number(pkg.Dec_Price).toFixed(2)} – {pkg.Int_NumbTicket} tickets
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-zinc-600 md:grid-cols-3 lg:grid-cols-4 dark:text-zinc-300">
                            {pkg.obj_Tickets.map((ticket, i) => (
                              <span
                                key={i}
                                className="inline-block rounded border border-zinc-200 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
                              >
                                {ticket}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}