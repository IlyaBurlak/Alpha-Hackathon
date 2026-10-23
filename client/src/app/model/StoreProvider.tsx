import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

import { SessionStoreContext } from '@/entities/session'
import { UserStoreContext } from '@/entities/user'

import { RootStore } from './root-store'

interface StoreProviderProps {
  children: ReactNode
}

export function StoreProvider({ children }: StoreProviderProps) {
  const [rootStore] = useState(() => new RootStore())

  useEffect(() => rootStore.start(), [rootStore])

  return (
    <SessionStoreContext value={rootStore.session}>
      <UserStoreContext value={rootStore.user}>{children}</UserStoreContext>
    </SessionStoreContext>
  )
}
