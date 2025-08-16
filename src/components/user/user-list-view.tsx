'use client'

import { Badge, BadgeColor } from '@/components/badge'
import { Button } from '@/components/button'
import { Heading } from '@/components/heading'
import { Input, InputGroup } from '@/components/input'
import { Select } from '@/components/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/table'
import { User } from '@/types/user'
import { PlusIcon } from '@heroicons/react/16/solid'

interface Props {
  users: User[]
  session: any
  setUsers: React.Dispatch<React.SetStateAction<User[]>>
}

export default function UserListView({ users, setUsers, session }: Props) {
  const userStatusMap = {
    1: { label: 'Active', color: 'zinc' },
    2: { label: 'Inactive', color: 'lime' },
  } as const satisfies Partial<Record<number, { label: string; color: BadgeColor }>>
  const fallback = { label: 'Unknown', color: 'zinc' } as const
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
            {/* <TableHeader className="text-right">Status</TableHeader> */}
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => {
            // const { label, color } = userStatusMap[user.Int_UserAccess ?? 0] ?? fallback

            return (
              <TableRow key={user.Guid_UserId} href={`/users/${user.Guid_UserId}`} title={`User #${user.Guid_UserId}`}>
                <TableCell>
                  {user.VC_FirstName} {user.VC_LastName}
                </TableCell>
                <TableCell>{user.VC_Email}</TableCell>
                {/* <TableCell className="text-right">
                  <Badge color={color}>{label}</Badge>
                </TableCell> */}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </>
  )
}
