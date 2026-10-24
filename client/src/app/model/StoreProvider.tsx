import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

import { ApplicationListStoreContext } from '@/entities/application'
import { ExternalServicesStoreContext } from '@/entities/external-service'
import { SessionStoreContext } from '@/entities/session'
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
          <ExternalServicesStoreContext value={rootStore.externalServices}>
            <ToastProvider>{children}</ToastProvider>
          </ExternalServicesStoreContext>
        </ApplicationListStoreContext>
      </UserStoreContext>
    </SessionStoreContext>
  )
}
