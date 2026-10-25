import { createContext, useContext } from 'react'

import type { StaffApplicationListStore } from './staff-application-list-store'

export const StaffApplicationListStoreContext = createContext<StaffApplicationListStore | null>(null)

export function useStaffApplicationListStore(): StaffApplicationListStore {
  const store = useContext(StaffApplicationListStoreContext)
  if (!store) throw new Error('useStaffApplicationListStore must be used inside StaffApplicationListStoreContext')
  return store
}
