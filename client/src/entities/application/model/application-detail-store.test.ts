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

  it('replaces the application after an action returned a fresher copy', async () => {
    vi.mocked(getApplication).mockResolvedValue(mapApplication(APPLICATION_WITH_OFFERS_DTO))
    const store = new ApplicationDetailStore()
    await store.load(2)
    const selected = mapApplication(SELECTED_APPLICATION_DTO)

    store.update(selected)

    expect(store.state).toEqual({ status: 'success', application: selected })
  })
})
