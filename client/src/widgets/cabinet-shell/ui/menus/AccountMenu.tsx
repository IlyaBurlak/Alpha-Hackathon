import { LogoutButton } from '@/features/logout'
import type { User } from '@/entities/user'
import { getPersonInitials } from '@/entities/user'
import { Avatar, MenuDivider, MenuItem } from '@/shared/ui'

interface AccountMenuProps {
  user: User
  /** The role of the user in the selected company. */
  role: string | null
  onOpenHelp: () => void
}

export function AccountMenu({ user, role, onOpenHelp }: AccountMenuProps) {
  return (
    <>
      <MenuItem
        title={user.fullName}
        description={role ?? user.login}
        leading={<Avatar initials={getPersonInitials(user.fullName)} shape="round" />}
      />
      <MenuDivider />
      <MenuItem title="Помощь" onClick={onOpenHelp} />
      <LogoutButton />
    </>
  )
}
