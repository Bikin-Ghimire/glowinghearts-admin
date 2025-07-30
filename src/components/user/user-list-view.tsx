'use client'

import { Button } from '@/components/button'
import { Heading } from '@/components/heading'
import { Input, InputGroup } from '@/components/input'
import { Select } from '@/components/select'
import { User } from '@/types/user'
import { PlusIcon } from '@heroicons/react/16/solid'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/table'
import { Badge } from '@/components/badge'

interface Props {
  users: User[]
  session: any
  setUsers: React.Dispatch<React.SetStateAction<User[]>>
}

export default function UserListView({ users, setUsers, session }: Props) {

    const userStatusMap: Record<number, { label: string; color: string }> = {
    1: { label: 'Admin',   color: 'zinc' },
    2: { label: 'Active', color: 'lime'  },
    3: { label: 'Sales Complete',  color: 'amber' },
    4: { label: 'Charity',      color: 'cyan' },
    5: { label: 'Paid Out',      color: 'emerald' },
    6: { label: 'On Hold',      color: 'red' },
  }
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-sm:w-full sm:flex-1">
          <Heading>Users</Heading>
          <div className="mt-4 flex max-w-xl gap-4">
            <InputGroup>
              <Input placeholder="Search users…" />
            </InputGroup>
            <Select name="sort_by">
              <option value="name">Sort by name</option>
              <option value="date">Sort by date</option>
              <option value="status">Sort by status</option>
            </Select>
          </div>
        </div>
        <Button href="/users/create-user">
          <PlusIcon className="mr-2" />
          CREATE USER
        </Button>
      </div>

      <Table className="mt-4 [--gutter:--spacing(6)] lg:[--gutter:--spacing(10)]">
        <TableHead>
          <TableRow>
            <TableHeader>Name</TableHeader>
            <TableHeader>Email</TableHeader>
            <TableHeader className="text-right">Status</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => {
            const { label: rlabel, color: rcolor } = userStatusMap[user?.Int_UserAccess] ?? {
              label: 'Unknown',
              color: 'zinc',
            }

            return (
              <TableRow
                key={user.Guid_UserId}
                href={`/users/${user.Guid_UserId}`}
                title={`User #${user.Guid_UserId}`}
              >
                <TableCell>{user.VC_FirstName} {user.VC_LastName}</TableCell>
                <TableCell>{user.VC_Email}</TableCell>
                <TableCell className="text-right">
                  <Badge color={rcolor || 'zinc'}>{rlabel || 'Unknown'}</Badge>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </>
  )
}
