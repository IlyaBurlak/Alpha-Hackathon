import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '@/shared/api'

import { getMyApplications } from '../api/applications'
import { mapApplications } from '../api/application-mapper'
import { SELECTED_APPLICATION_DTO } from '../api/application-dtos.fixture'
import { ApplicationListStore } from './application-list-store'

vi.mock('../api/applications')

beforeEach(() => {
  vi.mocked(getMyApplications).mockReset()
})

describe('ApplicationListStore', () => {
  it('starts idle', () => {
    expect(new ApplicationListStore().state).toEqual({ status: 'idle' })
  })

  it('goes loading -> success with the loaded applications', async () => {
    const applications = mapApplications([SELECTED_APPLICATION_DTO])
    vi.mocked(getMyApplications).mockResolvedValue(applications)
    const store = new ApplicationListStore()

    const loading = store.load()
    expect(store.state).toEqual({ status: 'loading' })
    await loading

    expect(store.state).toEqual({ status: 'success', applications })
  })

  it('keeps an empty list as a success state', async () => {
    vi.mocked(getMyApplications).mockResolvedValue([])
    const store = new ApplicationListStore()

    await store.load()

    expect(store.state).toEqual({ status: 'success', applications: [] })
  })

  it('shows the backend error message', async () => {
    vi.mocked(getMyApplications).mockRejectedValue(new ApiError(500, 'SQLITE_ERROR'))
    const store = new ApplicationListStore()

    await store.load()

    expect(store.state).toEqual({ status: 'error', message: 'SQLITE_ERROR' })
  })

  it('shows a generic message for unexpected errors', async () => {
    vi.mocked(getMyApplications).mockRejectedValue(new Error('boom'))
    const store = new ApplicationListStore()

    await store.load()

    expect(store.state).toEqual({ status: 'error', message: 'Что-то пошло не так. Попробуйте ещё раз.' })
  })
})

describe('ApplicationListStore: derived data', () => {
  const [older, newer, approved] = mapApplications([
    { ...SELECTED_APPLICATION_DTO, id: 1, createdAt: '2026-10-01T10:00:00.000Z' },
    { ...SELECTED_APPLICATION_DTO, id: 2, createdAt: '2026-10-05T10:00:00.000Z' },
    { ...SELECTED_APPLICATION_DTO, id: 3, organizationId: 2, status: 'APPROVED' },
  ])

  it('is empty before loading', () => {
    expect(new ApplicationListStore().getForOrganization(1)).toEqual([])
  })

  it('returns the applications of one organization, the latest first', async () => {
    vi.mocked(getMyApplications).mockResolvedValue([older, newer, approved])
    const store = new ApplicationListStore()

    await store.load()

    expect(store.getForOrganization(1).map(({ id }) => id)).toEqual([2, 1])
  })

  it('counts approved applications of the organization', async () => {
    vi.mocked(getMyApplications).mockResolvedValue([older, newer, approved])
    const store = new ApplicationListStore()
    await store.load()

    expect(store.getApprovedCount(1)).toBe(0)
    expect(store.getApprovedCount(2)).toBe(1)
  })
})

describe('ApplicationListStore: refresh and loadOnce', () => {
  it('refreshes quietly: no loading state, new data replaces old', async () => {
    vi.mocked(getMyApplications).mockResolvedValueOnce([]).mockResolvedValueOnce(mapApplications([SELECTED_APPLICATION_DTO]))
    const store = new ApplicationListStore()
    await store.load()

    const refreshing = store.refresh()
    expect(store.state.status).toBe('success')
    await refreshing

    expect(store.state).toMatchObject({ status: 'success', applications: [{ id: 2 }] })
  })

  it('keeps the old list when a refresh fails', async () => {
    vi.mocked(getMyApplications).mockResolvedValueOnce([]).mockRejectedValueOnce(new ApiError(500, 'fail'))
    const store = new ApplicationListStore()
    await store.load()

    await store.refresh()

    expect(store.state).toEqual({ status: 'success', applications: [] })
  })

  it('loads on refresh when nothing is shown yet', async () => {
    vi.mocked(getMyApplications).mockResolvedValue([])
    const store = new ApplicationListStore()

    await store.refresh()

    expect(store.state.status).toBe('success')
  })

  it('loadOnce asks the backend only the first time', async () => {
    vi.mocked(getMyApplications).mockResolvedValue([])
    const store = new ApplicationListStore()

    await store.loadOnce()
    await store.loadOnce()

    expect(getMyApplications).toHaveBeenCalledTimes(1)
  })
})
