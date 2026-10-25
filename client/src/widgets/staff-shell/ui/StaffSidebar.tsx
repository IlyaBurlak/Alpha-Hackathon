import { Link, useLocation } from 'react-router'

import type { Employee } from '@/entities/employee'
import { ROUTES } from '@/shared/config'
import { Avatar, Icon } from '@/shared/ui'

import { STAFF_NAVIGATION } from '../config/staff-navigation'
import styles from './StaffSidebar.module.css'

interface StaffSidebarProps {
  employee: Employee
  counters: { queue: number; mine: number }
  onLogout: () => void
}

export function StaffSidebar({ employee, counters, onLogout }: StaffSidebarProps) {
  const { pathname } = useLocation()

  return (
    <aside className={styles.side}>
      <Link className={styles.logo} to={ROUTES.staff}>
        <i className={styles.logoMark} />
        Бизнес-кредиты
      </Link>
      <div className={styles.role}>Кабинет сотрудника</div>
      <nav className={styles.nav} aria-label="Разделы">
        {STAFF_NAVIGATION.map((item) => {
          const count = item.counter ? counters[item.counter] : 0
          return (
            <Link key={item.to} className={styles.link} to={item.to} aria-current={item.isCurrent(pathname) ? 'page' : undefined}>
              <Icon name={item.icon} size={20} />
              <span>{item.label}</span>
              {count > 0 && <span className={styles.counter}>{count}</span>}
            </Link>
          )
        })}
      </nav>
      <div className={styles.me}>
        <Avatar initials={employee.initials} shape="round" />
        <span className={styles.meText}>
          <b className={styles.meName}>{employee.name}</b>
          <small className={styles.mePosition}>{employee.position}</small>
        </span>
        <button type="button" className={styles.logout} aria-label="Выйти" title="Выйти" onClick={onLogout}>
          <Icon name="logout" size={20} />
        </button>
      </div>
    </aside>
  )
}
