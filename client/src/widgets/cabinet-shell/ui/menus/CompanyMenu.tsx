import type { Organization } from '@/entities/user'
import { ORGANIZATION_TYPE_LABELS, getOrganizationInitials } from '@/entities/user'
import { Avatar, Icon, MenuHeading, MenuItem } from '@/shared/ui'

interface CompanyMenuProps {
  organizations: readonly Organization[]
  selectedOrganizationId: number
  onSelect: (organization: Organization) => void
}

export function CompanyMenu({ organizations, selectedOrganizationId, onSelect }: CompanyMenuProps) {
  return (
    <>
      <MenuHeading>Компания</MenuHeading>
      {organizations.map((organization) => (
        <MenuItem
          key={organization.id}
          title={organization.name}
          description={organization.role ?? ORGANIZATION_TYPE_LABELS[organization.type]}
          leading={<Avatar initials={getOrganizationInitials(organization.name)} shape="square" />}
          trailing={organization.id === selectedOrganizationId ? <Icon name="check" size={20} /> : null}
          onClick={() => onSelect(organization)}
        />
      ))}
    </>
  )
}
