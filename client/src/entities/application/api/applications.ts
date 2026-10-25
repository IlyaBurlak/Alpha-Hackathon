import { httpClient } from '@/shared/api'

import { readLocalDetails, saveLocalDetails } from '../lib/local-details/local-details'
import { APPLICATION_STATUSES } from '../model/types'
import type { Application, CreateApplicationInput, ProductOffer } from '../model/types'
import { mapApplication, mapApplications } from './application-mapper'
import { applyMocks } from './mocks/mock-enrichment'

const APPLICATIONS_PATH = '/applications'
const MY_APPLICATIONS_PATH = `${APPLICATIONS_PATH}/my`

/** Adds what the backend does not return: the goal, the chosen product, the user's own actions and the mocks. */
function withLocalDetails(application: Application): Application {
  const details = readLocalDetails(application.id)
  const { goal, selectedProduct } = details
  const shouldRestoreProduct =
    application.productChoice.kind === 'not-selected' &&
    application.status !== APPLICATION_STATUSES.draft &&
    selectedProduct !== null
  return applyMocks(
    {
      ...application,
      goal,
      productChoice: shouldRestoreProduct ? { kind: 'selected', product: selectedProduct } : application.productChoice,
    },
    details,
    Date.now(),
  )
}

export async function createApplication({
  organizationId,
  sum,
  creditTime,
  goal,
}: CreateApplicationInput): Promise<Application> {
  const body = { organizationId, sum, creditTime: { units: creditTime.unit, value: creditTime.value } }
  const application = mapApplication(await httpClient.post(APPLICATIONS_PATH, body))
  saveLocalDetails(application.id, { goal })
  return withLocalDetails(application)
}

export async function getMyApplications(): Promise<Application[]> {
  return mapApplications(await httpClient.get(MY_APPLICATIONS_PATH))
    .filter(({ id }) => !readLocalDetails(id).isDiscarded)
    .map(withLocalDetails)
}

export async function getApplication(applicationId: number): Promise<Application> {
  return withLocalDetails(mapApplication(await httpClient.get(`${APPLICATIONS_PATH}/${applicationId}`)))
}

/** Chooses the product; the backend sends the application to review after that. */
export async function selectApplicationProduct(applicationId: number, offer: ProductOffer): Promise<Application> {
  const query = new URLSearchParams({ applicationId: String(applicationId), productId: String(offer.id) })
  const application = mapApplication(await httpClient.put(`${APPLICATIONS_PATH}?${query}`))
  saveLocalDetails(applicationId, {
    selectedProduct: { name: offer.name, interestRate: offer.interestRate, payments: offer.payments },
    isSecured: offer.collateral > 0,
    submittedAt: Date.now(),
  })
  return withLocalDetails(application)
}

/** Accepts or declines the other conditions an employee offered. */
export async function answerSpecialOffer(applicationId: number, isAccepted: boolean): Promise<void> {
  const status = isAccepted ? APPLICATION_STATUSES.offerAccepted : APPLICATION_STATUSES.offerDeclined
  await httpClient.put(`${APPLICATIONS_PATH}/${applicationId}/special?${new URLSearchParams({ status })}`)
}
