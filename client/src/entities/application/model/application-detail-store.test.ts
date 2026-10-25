import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '@/shared/api'

import { getApplication } from '../api/applications'
import { mapApplication } from '../api/application-mapper'
import { APPLICATION_WITH_OFFERS_DTO, SELECTED_APPLICATION_DTO } from '../api/application-dtos.fixture'
import { ApplicationDetailStore } from './application-detail-store'

vi.mock('../api/applications')

beforeEach(() => {
  vi.mocked(getApplication).mockReset()
})

describe('ApplicationDetailStore', () => {
  it('loads the application by id', async () => {
    const application = mapApplication(APPLICATION_WITH_OFFERS_DTO)
    vi.mocked(getApplication).mockResolvedValue(application)
    const store = new ApplicationDetailStore()

    const loading = store.load(2)
    expect(store.state).toEqual({ status: 'loading' })
    await loading

    expect(getApplication).toHaveBeenCalledWith(2)
    expect(store.state).toEqual({ status: 'success', application })
  })

  it('shows the error message when loading fails', async () => {
    vi.mocked(getApplication).mockRejectedValue(new ApiError(500, 'Нет доступа к заявке'))
    const store = new ApplicationDetailStore()

    await store.load(2)

    expect(store.state).toEqual({ status: 'error', message: 'Нет доступа к заявке' })
  })

  it('refreshes quietly and keeps the old data when the refresh fails', async () => {
    const application = mapApplication(APPLICATION_WITH_OFFERS_DTO)
    vi.mocked(getApplication).mockResolvedValueOnce(application).mockRejectedValueOnce(new ApiError(500, 'fail'))
    const store = new ApplicationDetailStore()
    await store.load(2)

    await store.refresh(2)

    expect(store.state).toEqual({ status: 'success', application })
  })

  it('replaces the application with the refreshed one', async () => {
    vi.mocked(getApplication)
      .mockResolvedValueOnce(mapApplication(APPLICATION_WITH_OFFERS_DTO))
      .mockResolvedValueOnce(mapApplication(SELECTED_APPLICATION_DTO))
    const store = new ApplicationDetailStore()
    await store.load(2)

    await store.refresh(2)

    expect(store.state).toMatchObject({ status: 'success', application: { status: 'SUBMITTED' } })
  })

  it('does not refresh what was never loaded', async () => {
    const store = new ApplicationDetailStore()

    await store.refresh(2)

    expect(getApplication).not.toHaveBeenCalled()
  })
})
