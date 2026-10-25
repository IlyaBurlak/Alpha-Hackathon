import { mapStaffApplication, mapStaffApplications } from './staff-application-mapper'
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
 * The backend has no endpoints for the staff cabinet yet, so these functions read and write the mock database
 * (api/mocks). The responses go through the mapper like real ones; replace each body with a `httpClient` call
 * when the endpoints from docs/backend-requirements.md exist.
 */

/** GET /api/staff/applications */
export async function getStaffApplications(): Promise<StaffApplication[]> {
  return mapStaffApplications(listMockStaffApplications())
}

/** GET /api/staff/applications/:id */
export async function getStaffApplication(applicationId: string): Promise<StaffApplication> {
  return mapStaffApplication(getMockStaffApplication(applicationId))
}

/** PATCH /api/staff/applications/:id/assignee */
export async function assignStaffApplication(applicationId: string, assignee: ActingEmployee | null): Promise<StaffApplication> {
  return mapStaffApplication(assignMockStaffApplication(applicationId, assignee))
}

/** POST /api/staff/applications/:id/decision */
export async function decideStaffApplication(
  applicationId: string,
  decision: Decision,
  actor: ActingEmployee,
): Promise<StaffApplication> {
  return mapStaffApplication(decideMockStaffApplication(applicationId, decision, actor))
}

/** DELETE /api/staff/applications/:id/decision */
export async function reopenStaffApplication(applicationId: string, actor: ActingEmployee): Promise<StaffApplication> {
  return mapStaffApplication(reopenMockStaffApplication(applicationId, actor))
}
