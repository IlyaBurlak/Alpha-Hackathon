import { observer } from 'mobx-react-lite'
import { useCallback, useEffect, useRef } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'

import { useEmployeeStore } from '@/entities/employee'
import { useSessionStore } from '@/entities/session'
import { countNavigation, useStaffApplicationListStore } from '@/entities/staff-application'
import { ROUTES } from '@/shared/config'
import { classNames, useRefreshOnReturn } from '@/shared/lib'
import { STAFF_DENSITY_CLASS_NAME, useToast } from '@/shared/ui'

import styles from './StaffShell.module.css'
import { StaffSidebar } from './StaffSidebar'

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
    void employeeStore.loadProfile()
  }, [employeeStore])

  const refreshQueue = useCallback(async () => {
    const finished = await applications.refresh()
    finished.forEach(({ number }) => showToast(`№${number}: скоринг завершён`))
  }, [applications, showToast])

  // The queue is asked for news on opening a page of the cabinet and on coming back to the tab, never on a timer.
  useEffect(() => {
    void refreshQueue()
  }, [refreshQueue, pathname])

  useRefreshOnReturn(() => void refreshQueue())

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
      <a className={styles.skipLink} href="#main-content">
        Перейти к содержимому
      </a>
      <div className={classNames(styles.shell, STAFF_DENSITY_CLASS_NAME)}>
        <StaffSidebar employee={employee} counters={countNavigation(applications.applications, employee.id)} onLogout={handleLogout} />
        <div ref={panelRef} className={styles.panel}>
          <main id="main-content" className={styles.main} tabIndex={-1}>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
})
