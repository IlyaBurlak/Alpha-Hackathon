import { NavLink } from 'react-router'

import type { Organization, User } from '@/entities/user'
import { getOrganizationInitials, getPersonInitials } from '@/entities/user'
import { ROUTES } from '@/shared/config'
import { Avatar, Icon, Popover } from '@/shared/ui'

import { AccountMenu } from '../menus/AccountMenu'
import { CompanyMenu } from '../menus/CompanyMenu'
import { NAVIGATION_ITEMS } from '../../config/navigation'
import styles from './Sidebar.module.css'

interface SidebarProps {
  user: User
  selectedOrganization: Organization
  /** Approved applications that wait for the user. */
  approvedCount: number
  onSelectOrganization: (organization: Organization) => void
  onOpenHelp: () => void
}

export function Sidebar({ user, selectedOrganization, approvedCount, onSelectOrganization, onOpenHelp }: SidebarProps) {
  return (
    <aside className={styles.side} aria-label="Боковое меню">
      <NavLink className={styles.logo} to={ROUTES.cabinet}>
        <i className={styles.logoMark} />
        Бизнес-кредиты
      </NavLink>
      <Popover
        label="Выбор компании"
        renderTrigger={(triggerProps) => (
          <button type="button" className={styles.company} {...triggerProps}>
            <Avatar initials={getOrganizationInitials(selectedOrganization.name)} shape="square" />
            <span className={styles.companyText}>
              <b className={styles.companyName}>{selectedOrganization.name}</b>
              <small className={styles.companyMeta}>ИНН {selectedOrganization.inn}</small>
            </span>
            <Icon name="updown" size={18} />
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
      <nav className={styles.nav} aria-label="Разделы">
        {NAVIGATION_ITEMS.map((item) => (
          <NavLink key={item.to} className={styles.navLink} to={item.to} end={item.isExact}>
            <Icon name={item.icon} size={20} />
            <span>{item.label}</span>
            {item.hasApprovedCount && approvedCount > 0 && <span className={styles.counter}>{approvedCount}</span>}
          </NavLink>
        ))}
      </nav>
      <Popover
        className={styles.userAnchor}
        label="Профиль"
        renderTrigger={(triggerProps) => (
          <button type="button" className={styles.user} {...triggerProps}>
            <Avatar initials={getPersonInitials(user.fullName)} shape="round" />
            <span className={styles.userText}>
              <b className={styles.userName}>{user.fullName}</b>
              <small className={styles.userMeta}>{selectedOrganization.role ?? user.login}</small>
            </span>
            <Icon name="dots" size={20} />
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
    </aside>
  )
}
