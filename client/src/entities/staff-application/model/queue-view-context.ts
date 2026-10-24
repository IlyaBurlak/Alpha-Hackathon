import { createContext, useContext } from 'react'

import type { QueueViewStore } from './queue-view-store'

export const QueueViewStoreContext = createContext<QueueViewStore | null>(null)

export function useQueueViewStore(): QueueViewStore {
  const store = useContext(QueueViewStoreContext)
  if (!store) throw new Error('useQueueViewStore must be used inside QueueViewStoreContext')
  return store
}
