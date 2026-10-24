import { NavLink } from 'react-router'

import type { Organization, User } from '@/entities/user'
import { getOrganizationInitials, getPersonInitials } from '@/entities/user'
import { ROUTES } from '@/shared/config'
import { Avatar, Icon, Popover } from '@/shared/ui'

import { AccountMenu } from '../menus/AccountMenu'
import { CompanyMenu } from '../menus/CompanyMenu'
import styles from './MobileBars.module.css'
import { NAVIGATION_ITEMS } from '../../config/navigation'

interface MobileBarsProps {
  user: User
  selectedOrganization: Organization
  approvedCount: number
  onSelectOrganization: (organization: Organization) => void
  onOpenHelp: () => void
}

/** Top bar and bottom tab bar: the narrow-screen replacement of the sidebar. */
export function MobileTopBar({ user, selectedOrganization, onSelectOrganization, onOpenHelp }: Omit<MobileBarsProps, 'approvedCount'>) {
  return (
    <header className={styles.top}>
      <NavLink className={styles.logo} to={ROUTES.cabinet} aria-label="Главная" />
      <Popover
        className={styles.companyAnchor}
        label="Выбор компании"
        renderTrigger={(triggerProps) => (
          <button type="button" className={styles.company} {...triggerProps}>
            <Avatar initials={getOrganizationInitials(selectedOrganization.name)} shape="square" />
            <b className={styles.companyName}>{selectedOrganization.name}</b>
            <Icon name="updown" size={16} />
          </button>
        )}
      >
        {(close) => (
          <CompanyMenu
            organizations={user.organizations}
            selectedOrganizationId={selectedOrganization.id}
            onSelect={(organization) => {
              close()
              onSelectOrganization(organization)
            }}
          />
        )}
      </Popover>
      <Popover
        label="Профиль"
        renderTrigger={(triggerProps) => (
          <button type="button" className={styles.user} aria-label="Профиль" {...triggerProps}>
            <Avatar initials={getPersonInitials(user.fullName)} shape="round" />
          </button>
        )}
      >
        {(close) => (
          <AccountMenu
            user={user}
            role={selectedOrganization.role}
            onOpenHelp={() => {
              close()
              onOpenHelp()
            }}
          />
        )}
      </Popover>
    </header>
  )
}

export function MobileTabBar({ approvedCount }: Pick<MobileBarsProps, 'approvedCount'>) {
  return (
    <nav className={styles.tabbar} aria-label="Разделы">
      {NAVIGATION_ITEMS.map((item) => (
        <NavLink key={item.to} className={styles.tab} to={item.to} end={item.isExact}>
          <Icon name={item.icon} size={24} />
          <span>{item.tabLabel}</span>
          {item.hasApprovedCount && approvedCount > 0 && <i className={styles.dot} />}
        </NavLink>
      ))}
    </nav>
  )
}
