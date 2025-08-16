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
      cell: (info) => `$${info.getValue()}`,
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
    <div className="overflow-x-auto border rounded shadow-sm">
      <table className="min-w-[1200px] divide-y divide-gray-200 text-sm text-left">
        <thead className="bg-gray-50 sticky top-0 z-10">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="px-4 py-2 font-semibold text-gray-900 whitespace-nowrap">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {table.getRowModel().rows.map((row) => (
            <React.Fragment key={row.id}>
              <tr
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => row.toggleExpanded()}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-2 align-top">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>

              {row.getIsExpanded() && (
                <tr>
                  <td colSpan={columns.length} className="bg-gray-50 px-6 py-4">
                    <div className="space-y-4">
                      {row.original.obj_Packages.map((pkg, idx) => (
                        <div key={idx} className="border border-gray-200 rounded p-4">
                          <div className="text-sm font-semibold text-gray-700 mb-2">
                            {pkg.VC_Description} – ${pkg.Dec_Price} – {pkg.Int_NumbTicket} tickets
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-xs text-gray-600">
                            {pkg.obj_Tickets.map((ticket, i) => (
                              <span
                                key={i}
                                className="inline-block px-2 py-1 bg-white border border-gray-200 rounded"
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