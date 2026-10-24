import { observer } from 'mobx-react-lite'
import { useEffect, useRef } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'

import { useEmployeeStore } from '@/entities/employee'
import { useSessionStore } from '@/entities/session'
import { countNavigation, useStaffApplicationListStore } from '@/entities/staff-application'
import { ROUTES } from '@/shared/config'
import { classNames } from '@/shared/lib'
import { STAFF_DENSITY_CLASS_NAME, useToast } from '@/shared/ui'

import styles from './StaffShell.module.css'
import { StaffSidebar } from './StaffSidebar'

/** How often the queue asks for news: scoring finishes in the background. */
const QUEUE_REFRESH_INTERVAL_MS = 4000

/** Frame of the staff cabinet: the menu with the numbers of the queue and the page of the current route. */
export const StaffLayout = observer(function StaffLayout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const showToast = useToast()
  const session = useSessionStore()
  const employeeStore = useEmployeeStore()
  const applications = useStaffApplicationListStore()
  const panelRef = useRef<HTMLDivElement>(null)
  const { current: employee } = employeeStore

  useEffect(() => {
    void applications.loadOnce()
    const timer = window.setInterval(() => {
      void applications.refresh().then((finished) => {
        finished.forEach(({ number }) => showToast(`№${number}: скоринг завершён`))
      })
    }, QUEUE_REFRESH_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [applications, showToast])

  // The panel scrolls on wide screens and the window on narrow ones: a new page starts at the top in both.
  useEffect(() => {
    panelRef.current?.scrollTo(0, 0)
    window.scrollTo(0, 0)
  }, [pathname])

  const handleLogout = () => {
    session.signOut()
    employeeStore.setLogin(null)
    applications.reset()
    showToast('Вы вышли из кабинета')
    void navigate(ROUTES.staffLogin)
  }

  if (!employee) return null

  return (
    <div className={styles.page}>
      <div className={classNames(styles.shell, STAFF_DENSITY_CLASS_NAME)}>
        <StaffSidebar employee={employee} counters={countNavigation(applications.applications, employee.id)} onLogout={handleLogout} />
        <div ref={panelRef} className={styles.panel}>
          <main className={styles.main} tabIndex={-1}>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
})
