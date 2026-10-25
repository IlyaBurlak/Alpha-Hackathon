import { createContext, useContext } from 'react'

import type { SessionStore } from './session-store'

export const SessionStoreContext = createContext<SessionStore | null>(null)

export function useSessionStore(): SessionStore {
  const store = useContext(SessionStoreContext)
  if (!store) throw new Error('useSessionStore must be used inside SessionStoreContext')
  return store
}
