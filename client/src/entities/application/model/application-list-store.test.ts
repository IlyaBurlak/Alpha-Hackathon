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
