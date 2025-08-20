'use client'

import { signOut, useSession } from 'next-auth/react'

import { Avatar } from '@/components/avatar'
import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from '@/components/dropdown'
import { Navbar, NavbarItem, NavbarSection, NavbarSpacer } from '@/components/navbar'
import {
  Sidebar,
  SidebarBody,
  SidebarDivider,
  SidebarFooter,
  SidebarHeader,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
} from '@/components/sidebar'
import { SidebarLayout } from '@/components/sidebar-layout'
import {
  ArrowRightStartOnRectangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  UserCircleIcon,
} from '@heroicons/react/16/solid'
import { HomeIcon, SparklesIcon, TrophyIcon } from '@heroicons/react/20/solid'
import { usePathname } from 'next/navigation'

function AccountDropdownMenu({ anchor }: { anchor: 'top start' | 'bottom end' }) {
  return (
    <DropdownMenu className="min-w-64" anchor={anchor}>
      <DropdownItem href="/users/update-password">
        <UserCircleIcon />
        <DropdownLabel>Change Password</DropdownLabel>
      </DropdownItem>
      <DropdownDivider />
      <DropdownItem
        onClick={() => {
          document.cookie = 'rememberMeForward=; Max-Age=0; path=/'
          signOut({ redirect: true, callbackUrl: '/login' })
        }}
      >
        <ArrowRightStartOnRectangleIcon />
        <DropdownLabel>Sign out</DropdownLabel>
      </DropdownItem>
    </DropdownMenu>
  )
}

export function ApplicationLayout({ children }: { children: React.ReactNode }) {
  let pathname = usePathname()

  const { data: session } = useSession()
  const user = session?.user

  return (
    <SidebarLayout
      navbar={
        <Navbar>
          <NavbarSpacer />
          <NavbarSection>
            <Dropdown>
              <DropdownButton as={NavbarItem}>
                <UserCircleIcon className="size-10 text-zinc-500 dark:text-zinc-400" />
              </DropdownButton>
              <AccountDropdownMenu anchor="bottom end" />
            </Dropdown>
          </NavbarSection>
        </Navbar>
      }
      sidebar={
        <Sidebar>
          <SidebarHeader>
            <Dropdown>
              <DropdownButton as={SidebarItem}>
                <Avatar src="/teams/Dark_Icon.svg" />
                <SidebarLabel>Dashboard</SidebarLabel>
                <ChevronDownIcon />
              </DropdownButton>
              <DropdownMenu className="min-w-80 lg:min-w-64" anchor="bottom start">
                <DropdownDivider />
                <DropdownItem href='' target='_blank'>
                  <Avatar slot="icon" src="/teams/Dark_Icon.svg" />
                  <DropdownLabel>Visit Website</DropdownLabel>
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </SidebarHeader>

          <SidebarBody>
            <SidebarSection>
              <SidebarItem href="/" current={pathname === '/'}>
                <HomeIcon />
                <SidebarLabel>Home</SidebarLabel>
              </SidebarItem>
              <SidebarItem href="/charities" current={pathname.startsWith('/charities')}>
                <TrophyIcon />
                <SidebarLabel>Charity</SidebarLabel>
              </SidebarItem>
              {user?.charityAccess?.[0]?.Int_UserAccess === 1 && (
                <>
                  <SidebarDivider />
                  <SidebarItem href="/users" current={pathname.startsWith('/users')}>
                    <UserCircleIcon />
                    <SidebarLabel>Users</SidebarLabel>
                  </SidebarItem>
                </>
              )}
              <SidebarDivider />
              <SidebarItem href="/reports" current={pathname.startsWith('/reports')}>
                <SparklesIcon />
                <SidebarLabel>Reports</SidebarLabel>
              </SidebarItem>
            </SidebarSection>
          </SidebarBody>

          <SidebarFooter className="max-lg:hidden">
            <Dropdown>
              <DropdownButton as={SidebarItem}>
                <span className="flex min-w-0 items-center gap-3">
                  <UserCircleIcon className="size-10 text-zinc-500 dark:text-zinc-400" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm/5 font-medium text-zinc-950 dark:text-white">
                      {user?.email || 'User'}
                    </span>
                  </span>
                </span>
                <ChevronUpIcon />
              </DropdownButton>
              <AccountDropdownMenu anchor="top start" />
            </Dropdown>
          </SidebarFooter>
        </Sidebar>
      }
    >
      {children}
    </SidebarLayout>
  )
}
