import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { httpClient } from '@/shared/api'

import { readLocalDetails } from '../lib/local-details/local-details'
import { createApplication, getApplication, getMyApplications, selectApplicationProduct } from './applications'
import { mapApplication } from './application-mapper'
import {
  APPLICATION_WITH_OFFERS_DTO,
  APPLICATION_WITHOUT_OFFERS_DTO,
  SELECTED_APPLICATION_DTO,
  SUBMITTED_APPLICATION_WITHOUT_PRODUCT_DTO,
} from './application-dtos.fixture'

vi.mock('@/shared/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/api')>()),
  httpClient: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}))

class MemoryStorage {
  private readonly values = new Map<string, string>()

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }
}

beforeEach(() => {
  vi.mocked(httpClient.get).mockReset()
  vi.mocked(httpClient.post).mockReset()
  vi.mocked(httpClient.put).mockReset()
  Object.defineProperty(globalThis, 'localStorage', { value: new MemoryStorage(), configurable: true })
})

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'localStorage')
})

describe('createApplication', () => {
  it('posts the backend request shape: `creditTime.units`, not `unit`, and no goal', async () => {
    vi.mocked(httpClient.post).mockResolvedValue(APPLICATION_WITH_OFFERS_DTO)

    const application = await createApplication({
      organizationId: 1,
      sum: 1_000_000,
      creditTime: { unit: 'YEAR', value: 1 },
      goal: 'equipment',
    })

    expect(httpClient.post).toHaveBeenCalledWith('/applications', {
      organizationId: 1,
      sum: 1_000_000,
      creditTime: { units: 'YEAR', value: 1 },
    })
    expect(application.productChoice.kind).toBe('offers')
  })

  it('remembers the goal in the browser and returns it with the application', async () => {
    vi.mocked(httpClient.post).mockResolvedValue(APPLICATION_WITH_OFFERS_DTO)

    const application = await createApplication({
      organizationId: 1,
      sum: 1_000_000,
      creditTime: { unit: 'MONTH', value: 12 },
      goal: 'transport',
    })

    expect(application.goal).toBe('transport')
    expect(readLocalDetails(application.id).goal).toBe('transport')
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
  async function loadOffer() {
    const { productChoice } = mapApplication(APPLICATION_WITH_OFFERS_DTO)
    if (productChoice.kind !== 'offers') throw new Error('fixture has no offers')
    return productChoice.items[0]
  }

  it('puts applicationId and productId as query params, without a body', async () => {
    vi.mocked(httpClient.put).mockResolvedValue(SELECTED_APPLICATION_DTO)

    const application = await selectApplicationProduct(2, await loadOffer())

    expect(httpClient.put).toHaveBeenCalledWith('/applications?applicationId=2&productId=1')
    expect(application.status).toBe('SUBMITTED')
    expect(application.productChoice.kind).toBe('selected')
  })

  it('remembers the chosen product, because the backend does not return it yet', async () => {
    vi.mocked(httpClient.put).mockResolvedValue(SUBMITTED_APPLICATION_WITHOUT_PRODUCT_DTO)

    const application = await selectApplicationProduct(2, await loadOffer())

    expect(application.productChoice).toEqual({
      kind: 'selected',
      product: {
        name: 'Кредит для бизнеса с залогом',
        interestRate: 10,
        payments: 'ежемесячно, равными долями, с первым платежом через 6 месяцев',
      },
    })

    vi.mocked(httpClient.get).mockResolvedValue(SUBMITTED_APPLICATION_WITHOUT_PRODUCT_DTO)
    expect((await getApplication(2)).productChoice.kind).toBe('selected')
  })
})
