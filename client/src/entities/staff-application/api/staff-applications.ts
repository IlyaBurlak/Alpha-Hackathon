import { mapStaffApplication, mapStaffApplications } from './staff-application-mapper'
import {
  fetchBackendApplication,
  fetchBackendApplications,
  getBackendOperatorEmployeeId,
  rejectUnsupportedAssignment,
  rejectUnsupportedReopen,
  rejectUnsupportedRestart,
  restartBackendScoring,
  sendBackendDecision,
  takeBackendApplication,
} from './backend/backend-staff-api'
import {
  assignMockStaffApplication,
  decideMockStaffApplication,
  getMockStaffApplication,
  listMockStaffApplications,
  reopenMockStaffApplication,
} from './mocks/mock-staff-database'
import type { Decision, StaffApplication } from '../model/types'

/** The employee who does the action; the name goes to the history of the application. */
export interface ActingEmployee {
  id: string
  name: string
}

/*
 * A real operator (a token with the numeric backend id) works with the backend: the queue is `/applications/all`,
 * the card is `/applications/:id/score`, "take" and the decision are `/take` and `/solution`; what the backend does
 * not return yet comes from api/mocks/mock-review.ts. The demo employees of the design have no backend token,
 * so they keep working with the mock database (api/mocks). Both kinds of responses go through the same mapper.
 */

/** GET /api/applications/all */
export async function getStaffApplications(): Promise<StaffApplication[]> {
  if (getBackendOperatorEmployeeId() === null) return mapStaffApplications(listMockStaffApplications())
  return mapStaffApplications(await fetchBackendApplications(Date.now()))
}

/** GET /api/applications/:id/score */
export async function getStaffApplication(applicationId: string): Promise<StaffApplication> {
  if (getBackendOperatorEmployeeId() === null) return mapStaffApplication(getMockStaffApplication(applicationId))
  return mapStaffApplication(await fetchBackendApplication(applicationId, Date.now()))
}

/** POST /api/applications/:id/take; the backend knows only "take for myself". */
export async function assignStaffApplication(applicationId: string, assignee: ActingEmployee | null): Promise<StaffApplication> {
  const ownEmployeeId = getBackendOperatorEmployeeId()
  if (ownEmployeeId === null) return mapStaffApplication(assignMockStaffApplication(applicationId, assignee))
  if (assignee?.id !== ownEmployeeId) rejectUnsupportedAssignment()
  await takeBackendApplication(applicationId)
  return getStaffApplication(applicationId)
}

/** POST /api/applications/:id/solution */
export async function decideStaffApplication(
  applicationId: string,
  decision: Decision,
  actor: ActingEmployee,
): Promise<StaffApplication> {
  if (getBackendOperatorEmployeeId() === null) {
    return mapStaffApplication(decideMockStaffApplication(applicationId, decision, actor))
  }
  const current = await getStaffApplication(applicationId)
  await sendBackendDecision(applicationId, decision, current.assigneeId !== null)
  return getStaffApplication(applicationId)
}

/** Not on the backend yet (docs/backend-requirements.md): the mock database reopens the demo applications only. */
export async function reopenStaffApplication(applicationId: string, actor: ActingEmployee): Promise<StaffApplication> {
  if (getBackendOperatorEmployeeId() !== null) rejectUnsupportedReopen()
  return mapStaffApplication(reopenMockStaffApplication(applicationId, actor))
}

/** POST /api/applications/:id/restart: only the backend runs a scoring; the demo applications have none to restart. */
export async function restartStaffScoring(applicationId: string): Promise<StaffApplication> {
  if (getBackendOperatorEmployeeId() === null) rejectUnsupportedRestart()
  await restartBackendScoring(applicationId)
  return getStaffApplication(applicationId)
}
