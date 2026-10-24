import { createContext, useContext } from 'react'

import type { ApplicationListStore } from './application-list-store'

export const ApplicationListStoreContext = createContext<ApplicationListStore | null>(null)

export function useApplicationListStore(): ApplicationListStore {
  const store = useContext(ApplicationListStoreContext)
  if (!store) throw new Error('useApplicationListStore must be used inside ApplicationListStoreContext')
  return store
}
