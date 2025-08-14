'use client'

import { Badge } from '@/components/badge'
import { Divider } from '@/components/divider'
import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
} from '@/components/dropdown'
import { Link } from '@/components/link'
import { EllipsisVerticalIcon } from '@heroicons/react/16/solid'
import { useCharityListActions } from '@/hooks/use-charity-list-actions'
import { Charity } from '@/types/charity'

interface Props {
  charity: Charity
  session: any
  refetchCharities: () => void
}

export default function CharityListItem({ charity, session, refetchCharities }: Props) {
  const { handleActivate, handleDeactivate } = useCharityListActions(session, refetchCharities)
  const user = session?.user

  const statusMap = {
    1: { label: 'Active', color: 'lime' },
    2: { label: 'Disabled', color: 'red' },
    3: { label: 'Review', color: 'zinc' },
  }

  const { label, color } = statusMap[charity.Int_CharityStatus] ?? { label: 'Unknown', color: 'zinc' }

  return (
    <li>
      <Divider soft />
      <div className="flex items-center justify-between py-4">
        <div className="font-semibold">
          <Link href={`/charities/${charity.Guid_CharityId}`}>{charity.VC_CharityDesc}</Link>
        </div>
        <div className="flex items-center gap-4">
          <Badge color={color}>{label}</Badge>
          { [1, 2].includes(user?.charityAccess?.[0]?.Int_UserAccess ?? 0) && (
          <Dropdown>
            <DropdownButton plain aria-label="More options">
              <EllipsisVerticalIcon />
            </DropdownButton>
            <DropdownMenu anchor="bottom end">
              <DropdownSection>
                <DropdownItem href={`/charities/${charity.Guid_CharityId}`}>View</DropdownItem>
                <DropdownItem href={`/charities/${charity.Guid_CharityId}/edit`}>Edit</DropdownItem>
              </DropdownSection>
              <DropdownDivider />
              <DropdownSection>
                {(charity.Int_CharityStatus === 2 || charity.Int_CharityStatus === 3) && (
                  <DropdownItem onClick={() => handleActivate(charity.Guid_CharityId)}>
                    <span className="text-green-600">Activate</span>
                  </DropdownItem>
                )}
                {(charity.Int_CharityStatus === 1 || charity.Int_CharityStatus === 3) && (
                  <DropdownItem onClick={() => handleDeactivate(charity.Guid_CharityId)}>
                    <span className="text-red-600">Disable</span>
                  </DropdownItem>
                )}
              </DropdownSection>
            </DropdownMenu>
          </Dropdown>
          )}
        </div>
      </div>
    </li>
  )
}