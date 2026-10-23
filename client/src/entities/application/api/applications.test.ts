import { beforeEach, describe, expect, it, vi } from 'vitest'

import { httpClient } from '@/shared/api'

import { createApplication, getApplication, getMyApplications, selectApplicationProduct } from './applications'
import {
  APPLICATION_WITH_OFFERS_DTO,
  APPLICATION_WITHOUT_OFFERS_DTO,
  SELECTED_APPLICATION_DTO,
} from './application-dtos.fixture'

vi.mock('@/shared/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/api')>()),
  httpClient: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}))

beforeEach(() => {
  vi.mocked(httpClient.get).mockReset()
  vi.mocked(httpClient.post).mockReset()
  vi.mocked(httpClient.put).mockReset()
})

describe('createApplication', () => {
  it('posts the backend request shape: `creditTime.units`, not `unit`', async () => {
    vi.mocked(httpClient.post).mockResolvedValue(APPLICATION_WITH_OFFERS_DTO)

    const application = await createApplication({
      organizationId: 1,
      sum: 1_000_000,
      creditTime: { unit: 'YEAR', value: 1 },
    })

    expect(httpClient.post).toHaveBeenCalledWith('/applications', {
      organizationId: 1,
      sum: 1_000_000,
      creditTime: { units: 'YEAR', value: 1 },
    })
    expect(application.productChoice.kind).toBe('offers')
  })
})

describe('getMyApplications', () => {
  it('requests /applications/my and maps the list', async () => {
    vi.mocked(httpClient.get).mockResolvedValue([APPLICATION_WITHOUT_OFFERS_DTO, SELECTED_APPLICATION_DTO])

    const applications = await getMyApplications()

    expect(httpClient.get).toHaveBeenCalledWith('/applications/my')
    expect(applications).toHaveLength(2)
  })
})

describe('getApplication', () => {
  it('requests the application by id', async () => {
    vi.mocked(httpClient.get).mockResolvedValue(SELECTED_APPLICATION_DTO)

    const application = await getApplication(7)

    expect(httpClient.get).toHaveBeenCalledWith('/applications/7')
    expect(application.productChoice.kind).toBe('selected')
  })
})

describe('selectApplicationProduct', () => {
  it('puts applicationId and productId as query params, without a body', async () => {
    vi.mocked(httpClient.put).mockResolvedValue(SELECTED_APPLICATION_DTO)

    const application = await selectApplicationProduct(2, 1)

    expect(httpClient.put).toHaveBeenCalledWith('/applications?applicationId=2&productId=1')
    expect(application.status).toBe('SUBMITTED')
    expect(application.productChoice.kind).toBe('selected')
  })
})
