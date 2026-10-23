import { createContext, useContext } from 'react'

import type { ExternalServicesStore } from './external-services-store'

export const ExternalServicesStoreContext = createContext<ExternalServicesStore | null>(null)

export function useExternalServicesStore(): ExternalServicesStore {
  const store = useContext(ExternalServicesStoreContext)
  if (!store) throw new Error('useExternalServicesStore must be used inside ExternalServicesStoreContext')
  return store
}
