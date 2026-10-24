import { createContext, useContext } from 'react'

import type { EmployeeStore } from './employee-store'
import type { Employee } from './types'

export const EmployeeStoreContext = createContext<EmployeeStore | null>(null)

export function useEmployeeStore(): EmployeeStore {
  const store = useContext(EmployeeStoreContext)
  if (!store) throw new Error('useEmployeeStore must be used inside EmployeeStoreContext')
  return store
}

/** The signed-in employee, for screens that are shown only to employees. */
export function useCurrentEmployee(): Employee {
  const { current } = useEmployeeStore()
  if (!current) throw new Error('useCurrentEmployee must be used when an employee is signed in')
  return current
}
