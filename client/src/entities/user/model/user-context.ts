import { createContext, useContext } from 'react'

import type { UserStore } from './user-store'

export const UserStoreContext = createContext<UserStore | null>(null)

export function useUserStore(): UserStore {
  const store = useContext(UserStoreContext)
  if (!store) throw new Error('useUserStore must be used inside UserStoreContext')
  return store
}
