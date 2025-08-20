// components/Raffle/RaffleChangeLogsTab.tsx
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
  const columns: ColumnDef<Log, any>[] = [
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
      cell: ({ getValue }) => getValue() ?? '-',
    }),
    columnHelper.accessor('VC_Admin_LastName', {
      header: 'Last Name',
      cell: ({ getValue }) => getValue() ?? '-',
    }),
    columnHelper.accessor('Txt_GameDetails', {
      header: 'Game Details',
      cell: ({ getValue }) => (
        <div
          className="prose prose-sm max-w-[400px] line-clamp-3 hover:line-clamp-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: getValue() || '' }}
        />
      ),
    }),
    columnHelper.accessor('Txt_GameRules', {
      header: 'Game Rules',
      cell: ({ getValue }) => (
        <div
          className="prose prose-sm max-w-[400px] line-clamp-3 hover:line-clamp-none dark:prose-invert"
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
    <div className="overflow-x-auto rounded border border-zinc-200 shadow-sm dark:border-zinc-700">
      <table className="min-w-[1500px] text-left text-sm text-zinc-900 dark:text-zinc-100">
        <thead className="sticky top-0 z-10 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-zinc-200 dark:border-zinc-700">
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="whitespace-nowrap px-4 py-3 font-semibold">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-zinc-100 bg-white dark:divide-zinc-800 dark:bg-zinc-900">
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800">
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="max-w-[400px] whitespace-pre-wrap break-words px-4 py-3 align-top text-sm text-zinc-700 dark:text-zinc-200"
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