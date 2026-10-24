import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

import { ApplicationListStoreContext } from '@/entities/application'
import { EmployeeStoreContext } from '@/entities/employee'
import { ExternalServicesStoreContext } from '@/entities/external-service'
import { SessionStoreContext } from '@/entities/session'
import { QueueViewStoreContext, StaffApplicationListStoreContext } from '@/entities/staff-application'
import { UserStoreContext } from '@/entities/user'
import { ToastProvider } from '@/shared/ui'

import { RootStore } from './root-store'

interface StoreProviderProps {
  children: ReactNode
}

export function StoreProvider({ children }: StoreProviderProps) {
  const [rootStore] = useState(() => new RootStore())

  useEffect(() => rootStore.start(), [rootStore])

  return (
    <SessionStoreContext value={rootStore.session}>
      <UserStoreContext value={rootStore.user}>
        <ApplicationListStoreContext value={rootStore.applications}>
          <EmployeeStoreContext value={rootStore.employee}>
            <StaffApplicationListStoreContext value={rootStore.staffApplications}>
              <QueueViewStoreContext value={rootStore.queueView}>
                <ExternalServicesStoreContext value={rootStore.externalServices}>
                  <ToastProvider>{children}</ToastProvider>
                </ExternalServicesStoreContext>
              </QueueViewStoreContext>
            </StaffApplicationListStoreContext>
          </EmployeeStoreContext>
        </ApplicationListStoreContext>
      </UserStoreContext>
    </SessionStoreContext>
  )
}
