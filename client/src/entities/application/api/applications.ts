import { httpClient } from '@/shared/api'

import type { Application, CreateApplicationInput } from '../model/types'
import { mapApplication, mapApplications } from './application-mapper'

const APPLICATIONS_PATH = '/applications'
const MY_APPLICATIONS_PATH = `${APPLICATIONS_PATH}/my`

export async function createApplication({ organizationId, sum, creditTime }: CreateApplicationInput): Promise<Application> {
  const body = { organizationId, sum, creditTime: { units: creditTime.unit, value: creditTime.value } }
  return mapApplication(await httpClient.post(APPLICATIONS_PATH, body))
}

export async function getMyApplications(): Promise<Application[]> {
  return mapApplications(await httpClient.get(MY_APPLICATIONS_PATH))
}

export async function getApplication(applicationId: number): Promise<Application> {
  return mapApplication(await httpClient.get(`${APPLICATIONS_PATH}/${applicationId}`))
}

/** Chooses the product; the backend sends the application to review after that. */
export async function selectApplicationProduct(applicationId: number, productId: number): Promise<Application> {
  const query = new URLSearchParams({ applicationId: String(applicationId), productId: String(productId) })
  return mapApplication(await httpClient.put(`${APPLICATIONS_PATH}?${query}`))
}
