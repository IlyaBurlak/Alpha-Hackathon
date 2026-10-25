import { beforeEach, describe, expect, it, vi } from 'vitest'

import { httpClient } from '@/shared/api'

vi.mock('@/shared/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/api')>()),
  httpClient: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}))

const NOW = new Date('2026-10-26T12:00:00Z').getTime()

function createItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    organizationId: 2,
    sum: 3_000_000,
    status: 'SUBMITTED',
    createdAt: '2026-10-25T10:00:00.000Z',
    creditTime: { units: 'MONTH', value: 24 },
    applicationScore: { id: 1, status: 'WAITONGOPERATOR', mlScore: {} },
    ...overrides,
  }
}

/** A fresh module per test: the cache lives in the module. */
async function loadModule() {
  vi.resetModules()
  return import('./backend-staff-api')
}

function mockServer(items: unknown[]) {
  vi.mocked(httpClient.get).mockImplementation((path: string) => {
    if (path === '/applications/all') return Promise.resolve(items)
    const id = Number(path.split('/')[2])
    return Promise.resolve(items.find((item) => (item as { id: number }).id === id))
  })
}

const scoreRequests = () => vi.mocked(httpClient.get).mock.calls.filter(([path]) => path.endsWith('/score')).length

beforeEach(() => {
  vi.mocked(httpClient.get).mockReset()
})

describe('fetchBackendApplications', () => {
  it('asks for the score of an application once while nothing changes', async () => {
    const { fetchBackendApplications } = await loadModule()
    mockServer([createItem(), createItem({ id: 2 })])

    await fetchBackendApplications(NOW)
    await fetchBackendApplications(NOW)
    await fetchBackendApplications(NOW)

    expect(scoreRequests()).toBe(2)
  })

  it('asks again for the application whose status, scoring stage or operator changed', async () => {
    const { fetchBackendApplications } = await loadModule()
    mockServer([createItem(), createItem({ id: 2 })])
    await fetchBackendApplications(NOW)

    mockServer([createItem({ operator: { id: 1 } }), createItem({ id: 2 })])
    await fetchBackendApplications(NOW)
    expect(scoreRequests()).toBe(3)

    mockServer([createItem({ operator: { id: 1 }, status: 'APPROVED' }), createItem({ id: 2, applicationScore: { status: 'COMPLETED' } })])
    await fetchBackendApplications(NOW)
    expect(scoreRequests()).toBe(5)
  })

  it('asks for the score of a new application only', async () => {
    const { fetchBackendApplications } = await loadModule()
    mockServer([createItem()])
    await fetchBackendApplications(NOW)

    mockServer([createItem(), createItem({ id: 2 })])
    await fetchBackendApplications(NOW)

    expect(scoreRequests()).toBe(2)
  })

  it('skips drafts and does not ask for their score', async () => {
    const { fetchBackendApplications } = await loadModule()
    mockServer([createItem({ id: 3, status: 'DRAFT', applicationScore: undefined })])

    await expect(fetchBackendApplications(NOW)).resolves.toEqual([])
    expect(scoreRequests()).toBe(0)
  })

  it('shows the list item and retries next time when the score request fails', async () => {
    const { fetchBackendApplications } = await loadModule()
    vi.mocked(httpClient.get).mockImplementation((path: string) =>
      path === '/applications/all' ? Promise.resolve([createItem()]) : Promise.reject(new Error('offline')),
    )

    await expect(fetchBackendApplications(NOW)).resolves.toHaveLength(1)
    await fetchBackendApplications(NOW)

    expect(scoreRequests()).toBe(2)
  })
})
