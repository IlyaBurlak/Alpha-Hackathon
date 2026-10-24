import { Loader } from '@alfalab/core-components/loader'
import { observer } from 'mobx-react-lite'
import { useEffect, useRef } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'

import { useApplicationListStore } from '@/entities/application'
import type { Organization } from '@/entities/user'
import { useUserStore } from '@/entities/user'
import { ROUTES } from '@/shared/config'
import { Button, EmptyState, useToast } from '@/shared/ui'

import styles from './CabinetShell.module.css'
import { MobileTabBar, MobileTopBar } from './mobile-bars/MobileBars'
import { Sidebar } from './sidebar/Sidebar'

/** Frame of the entrepreneur cabinet: navigation, company switcher and the page of the current route. */
export const CabinetLayout = observer(function CabinetLayout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const panelRef = useRef<HTMLDivElement>(null)
  const showToast = useToast()
  const userStore = useUserStore()
  const applications = useApplicationListStore()
  const { state, selectedOrganization } = userStore

  useEffect(() => {
    void applications.loadOnce()
  }, [applications])

  // The panel scrolls on wide screens and the window on narrow ones: a new page starts at the top in both.
  useEffect(() => {
    panelRef.current?.scrollTo(0, 0)
    window.scrollTo(0, 0)
  }, [pathname])

  const handleSelectOrganization = (organization: Organization) => {
    userStore.selectOrganization(organization.id)
    showToast(organization.name)
    void navigate(ROUTES.cabinet)
  }

  const handleOpenHelp = () => {
    void navigate(ROUTES.help)
  }

  const renderContent = () => {
    if (state.status === 'idle' || state.status === 'loading') return <Loader />
    if (state.status === 'error') {
      return (
        <EmptyState
          title="Не удалось загрузить кабинет"
          text={state.message}
          action={<Button view="secondary" onClick={() => void userStore.load()}>Повторить</Button>}
        />
      )
    }
    if (selectedOrganization === null) {
      return <EmptyState title="Нет организаций" text="У вас пока нет организаций, подать заявку нельзя." />
    }
    return <Outlet />
  }

  const navigationProps =
    state.status === 'success' && selectedOrganization !== null
      ? {
          user: state.user,
          selectedOrganization,
          approvedCount: applications.getApprovedCount(selectedOrganization.id),
          onSelectOrganization: handleSelectOrganization,
          onOpenHelp: handleOpenHelp,
        }
      : null

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        {navigationProps && <Sidebar {...navigationProps} />}
        <div ref={panelRef} className={styles.panel}>
          {navigationProps && <MobileTopBar {...navigationProps} />}
          <main className={styles.main} tabIndex={-1}>
            {renderContent()}
          </main>
        </div>
        {navigationProps && <MobileTabBar approvedCount={navigationProps.approvedCount} />}
      </div>
    </div>
  )
})
