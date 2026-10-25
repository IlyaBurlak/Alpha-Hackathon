import { createContext, useContext } from 'react'

import type { Organization, User } from './types'
import type { UserStore } from './user-store'

export const UserStoreContext = createContext<UserStore | null>(null)

export function useUserStore(): UserStore {
  const store = useContext(UserStoreContext)
  if (!store) throw new Error('useUserStore must be used inside UserStoreContext')
  return store
}

/** The user of a screen that is rendered only after the user is loaded. */
export function useLoadedUser(): User {
  const { state } = useUserStore()
  if (state.status !== 'success') throw new Error('useLoadedUser must be used after the user is loaded')
  return state.user
}

/** The organization of a screen that is rendered only when the user has one. */
export function useSelectedOrganization(): Organization {
  const { selectedOrganization } = useUserStore()
  if (!selectedOrganization) throw new Error('useSelectedOrganization must be used when the user has an organization')
  return selectedOrganization
}
