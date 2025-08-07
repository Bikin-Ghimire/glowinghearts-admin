'use client'

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnDef,
  createColumnHelper,
} from '@tanstack/react-table'
import { format } from 'date-fns'

type Log = {
  VC_LicenseNumb: string
  VC_RaffleName: string
  VC_RaffleLocation: string
  Int_DrawStatus: number
  Dt_SalesOpen: string
  Dt_SalesClose: string
  Dt_CreateUpdate: string
  Txt_GameDetails: string
  Txt_GameRules: string
  User_Id: string
  VC_Admin_FirstName?: string | null
  VC_Admin_LastName?: string | null
}

type Props = {
  logs: Log[]
}

const columnHelper = createColumnHelper<Log>()

export function RaffleChangeLogsTab({ logs }: Props) {
  const columns: ColumnDef<Log>[] = [
    columnHelper.accessor('Dt_CreateUpdate', {
      header: 'Timestamp',
      cell: ({ getValue }) => format(new Date(getValue()), 'yyyy-MM-dd HH:mm:ss'),
    }),
    columnHelper.accessor('VC_LicenseNumb', { header: 'License No' }),
    columnHelper.accessor('VC_RaffleName', { header: 'Raffle Name' }),
    columnHelper.accessor('VC_RaffleLocation', { header: 'Location' }),
    columnHelper.accessor('Int_DrawStatus', { header: 'Draw Status' }),
    columnHelper.accessor('Dt_SalesOpen', {
      header: 'Sales Open',
      cell: ({ getValue }) => format(new Date(getValue()), 'MMM d, yyyy'),
    }),
    columnHelper.accessor('Dt_SalesClose', {
      header: 'Sales Close',
      cell: ({ getValue }) => format(new Date(getValue()), 'MMM d, yyyy'),
    }),
    columnHelper.accessor('User_Id', { header: 'User ID' }),
    columnHelper.accessor('VC_Admin_FirstName', {
      header: 'First Name',
      cell: ({ getValue }) => getValue() || '-',
    }),
    columnHelper.accessor('VC_Admin_LastName', {
      header: 'Last Name',
      cell: ({ getValue }) => getValue() || '-',
    }),
    columnHelper.accessor('Txt_GameDetails', {
      header: 'Game Details',
      cell: ({ getValue }) => (
        <div
          className="prose prose-sm max-w-[400px] line-clamp-3 hover:line-clamp-none"
          dangerouslySetInnerHTML={{ __html: getValue() || '' }}
        />
      ),
    }),
    columnHelper.accessor('Txt_GameRules', {
      header: 'Game Rules',
      cell: ({ getValue }) => (
        <div
          className="prose prose-sm max-w-[400px] line-clamp-3 hover:line-clamp-none"
          dangerouslySetInnerHTML={{ __html: getValue() || '' }}
        />
      ),
    }),
  ]

  const table = useReactTable({
    data: logs,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="overflow-x-auto border rounded shadow-sm">
      <table className="min-w-[1500px] divide-y divide-gray-200 text-sm text-left">
        <thead className="bg-gray-100 sticky top-0 z-10 text-xs uppercase tracking-wide text-gray-600">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="px-4 py-3 whitespace-nowrap font-semibold">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50">
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="px-4 py-3 align-top whitespace-pre-wrap break-words max-w-[400px] text-sm text-gray-700"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}