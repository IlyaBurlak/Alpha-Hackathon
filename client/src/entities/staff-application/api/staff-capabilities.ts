import { getBackendOperatorEmployeeId } from './backend/backend-staff-api'

/** What the signed-in employee can do; the screens hide the actions the backend cannot perform yet. */
export interface StaffCapabilities {
  /** The decision "request data" has no status on the backend. */
  canRequestData: boolean
  /** The backend cannot take a decision back. */
  canReopenDecision: boolean
  /** The backend only lets an operator take an application for themselves. */
  canAssignOthers: boolean
  /** The scoring is run by the backend, so only a real operator can restart it. */
  canRestartScoring: boolean
}

/** The demo employees work with the mock database, which can do everything; a real operator works with the backend. */
export function getStaffCapabilities(): StaffCapabilities {
  const isBackendOperator = getBackendOperatorEmployeeId() !== null
  return {
    canRequestData: !isBackendOperator,
    canReopenDecision: !isBackendOperator,
    canAssignOthers: !isBackendOperator,
    canRestartScoring: isBackendOperator,
  }
}
