'use client'

import { Badge, BadgeColor } from '@/components/badge'
import { Button } from '@/components/button'
import { Heading } from '@/components/heading'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/table'
import { useUsersAccessMap } from '@/hooks/use-user-acess-levels'
import { activateUser, deactivateUser, editUserInfo, updateUserAccess } from '@/lib/users'
import { userStatusMap } from '@/lib/utils'
import { User } from '@/types/user'
import { CheckIcon, PencilSquareIcon, PlusIcon, PowerIcon, XMarkIcon } from '@heroicons/react/16/solid'
import { useMemo, useState } from 'react'
import { Toaster, toast } from 'react-hot-toast'

interface Props {
  users: User[]
  session: any
  setUsers: React.Dispatch<React.SetStateAction<User[]>>
}

type AccessOption = { label: string; value: number }
const ACCESS_OPTIONS: AccessOption[] = [
  { label: 'Read Only', value: 3 },
  { label: 'Manager', value: 2 },
  { label: 'Admin Full', value: 1 },
]

function labelToInt(label?: string): number | undefined {
  if (!label) return
  const found = ACCESS_OPTIONS.find((o) => o.label.toLowerCase() === label.toLowerCase())
  return found?.value
}

export default function UserListView({ users, setUsers, session }: Props) {
  const userIds = useMemo(() => users.map((u) => u.Guid_UserId), [users])
  const { accessMap, loading } = useUsersAccessMap(userIds)

  // local UI state
  const [editingAccessId, setEditingAccessId] = useState<string | null>(null)
  const [accessDraft, setAccessDraft] = useState<Record<string, number>>({})
  const [savingAccessId, setSavingAccessId] = useState<string | null>(null)

  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [userDraft, setUserDraft] = useState<{ VC_FirstName: string; VC_LastName: string; VC_Email: string } | null>(
    null
  )
  const [savingUser, setSavingUser] = useState(false)

  // simple optimistic cache for access labels
  const [accessOverride, setAccessOverride] = useState<Record<string, string>>({})

  const handleStartEditAccess = (userId: string) => {
    setEditingAccessId(userId)
    const currentLabel = accessOverride[userId] ?? accessMap[userId]
    const initial = labelToInt(currentLabel) ?? 1
    setAccessDraft((prev) => ({ ...prev, [userId]: initial }))
  }

  const handleSaveAccess = async (userId: string) => {
    const nextInt = accessDraft[userId]
    if (nextInt == null) return
    const nextLabel = ACCESS_OPTIONS.find((o) => o.value === nextInt)?.label ?? 'N/A'
    if (!window.confirm(`Change access to "${nextLabel}" for this user?`)) return

    try {
      setSavingAccessId(userId)
      // DO NOT update UI yet — wait for DB
      await updateUserAccess(userId, nextInt, session)

      // ✅ only reflect after success
      setAccessOverride((prev) => ({ ...prev, [userId]: nextLabel }))
      toast.success(`Access updated to "${nextLabel}"`)
    } catch (e) {
      toast.error('Failed to update access')
    } finally {
      setSavingAccessId(null)
      setEditingAccessId(null)
    }
  }

  const handleCancelAccess = () => {
    setEditingAccessId(null)
  }

  const openEditUser = (u: User) => {
    setEditingUserId(u.Guid_UserId)
    setUserDraft({
      VC_FirstName: u.VC_FirstName ?? '',
      VC_LastName: u.VC_LastName ?? '',
      VC_Email: u.VC_Email ?? '',
    })
  }

  const saveUserInfo = async () => {
    if (!editingUserId || !userDraft) return
    if (!window.confirm('Save changes to this user?')) return
    try {
      setSavingUser(true)
      await editUserInfo(editingUserId, userDraft, session)
      // update list locally
      setUsers((prev) => prev.map((u) => (u.Guid_UserId === editingUserId ? { ...u, ...userDraft } : u)))
      toast.success('User info updated')
      setEditingUserId(null)
      setUserDraft(null)
    } catch {
      toast.error('Failed to save user')
    } finally {
      setSavingUser(false)
    }
  }

  const toggleActive = async (u: User) => {
    const isActive = u.Int_UserStatus === 1 // adjust if your status codes differ
    const confirmMsg = isActive ? 'Deactivate this user?' : 'Activate this user?'
    if (!window.confirm(confirmMsg)) return
    try {
      if (isActive) {
        await deactivateUser(u.Guid_UserId, session)
        setUsers((prev) => prev.map((x) => (x.Guid_UserId === u.Guid_UserId ? { ...x, Int_UserStatus: 0 } : x)))
        toast.success('User deactivated')
      } else {
        await activateUser(u.Guid_UserId, session)
        setUsers((prev) => prev.map((x) => (x.Guid_UserId === u.Guid_UserId ? { ...x, Int_UserStatus: 1 } : x)))
        toast.success('User activated')
      }
    } catch {
      toast.error('Failed to change status')
    }
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          className:
            'border border-zinc-200 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100',
          success: {
            iconTheme: { primary: '#22c55e', secondary: 'transparent' }, // green-500
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: 'transparent' }, // red-500
          },
        }}
      />
      <div className="flex flex-wrap items-end justify-between gap-4"></div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-sm:w-full sm:flex-1">
          <Heading>Users</Heading>
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
            <TableHeader>Access Level</TableHeader>
            <TableHeader className="text-right">Status / Actions</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => {
            const { label, color } = userStatusMap[user?.Int_UserStatus] ?? { label: 'Unknown', color: 'zinc' }
            const currentAccessLabel = accessOverride[user.Guid_UserId] ?? accessMap[user.Guid_UserId]

            const isEditingAccess = editingAccessId === user.Guid_UserId
            const draftVal = accessDraft[user.Guid_UserId]

            return (
              <TableRow key={user.Guid_UserId} title={`User #${user.Guid_UserId}`} href={``}>
                <TableCell className="flex items-center gap-2">
                  <span>
                    {user.VC_FirstName} {user.VC_LastName}
                  </span>
                  <button
                    type="button"
                    className="text-gray-500 hover:text-gray-800"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      openEditUser(user)
                    }}
                    title="Edit user info"
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                  </button>
                </TableCell>

                <TableCell>{user.VC_Email}</TableCell>

                <TableCell>
                  {isEditingAccess ? (
                    <div className="flex items-center gap-2">
                      <select
                        className="rounded-md border px-2 py-1 text-sm"
                        value={draftVal ?? labelToInt(currentAccessLabel) ?? 1}
                        onChange={(e) =>
                          setAccessDraft((prev) => ({ ...prev, [user.Guid_UserId]: Number(e.target.value) }))
                        }
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        disabled={savingAccessId === user.Guid_UserId} // <-- disable while saving
                      >
                        {ACCESS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>

                      {savingAccessId === user.Guid_UserId ? (
                        <svg
                          className="h-4 w-4 animate-spin text-zinc-400 dark:text-zinc-500"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          role="status"
                          aria-label="saving"
                        >
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="rounded p-1 hover:bg-gray-100"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleSaveAccess(user.Guid_UserId)
                            }}
                            title="Save"
                          >
                            <CheckIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="rounded p-1 hover:bg-gray-100"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleCancelAccess()
                            }}
                            title="Cancel"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>{currentAccessLabel ?? (loading ? 'Loading…' : 'N/A')}</span>
                      <button
                        type="button"
                        className="text-gray-500 hover:text-gray-800 disabled:opacity-50"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleStartEditAccess(user.Guid_UserId)
                        }}
                        title="Change access level"
                        disabled={loading || savingAccessId === user.Guid_UserId} // <-- block while saving
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Badge color={color as BadgeColor}>{label}</Badge>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        toggleActive(user)
                      }}
                      title={user.Int_UserStatus === 1 ? 'Deactivate' : 'Activate'}
                    >
                      <PowerIcon className="h-4 w-4" />
                      {user.Int_UserStatus === 1 ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      {/* Minimal inline modal using your own dialog later if you prefer */}
      {editingUserId && userDraft && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => {
            setEditingUserId(null)
            setUserDraft(null)
          }}
        >
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-lg font-semibold">Edit User</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm">First name</label>
                <input
                  className="w-full rounded border px-3 py-2"
                  value={userDraft.VC_FirstName}
                  onChange={(e) => setUserDraft({ ...userDraft, VC_FirstName: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm">Last name</label>
                <input
                  className="w-full rounded border px-3 py-2"
                  value={userDraft.VC_LastName}
                  onChange={(e) => setUserDraft({ ...userDraft, VC_LastName: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm">Email</label>
                <input
                  className="w-full rounded border px-3 py-2"
                  value={userDraft.VC_Email}
                  onChange={(e) => setUserDraft({ ...userDraft, VC_Email: e.target.value })}
                />
              </div>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  className="rounded px-3 py-2 hover:bg-gray-100"
                  onClick={() => {
                    setEditingUserId(null)
                    setUserDraft(null)
                  }}
                >
                  Cancel
                </button>
                <button
                  className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
                  onClick={saveUserInfo}
                  disabled={savingUser}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
