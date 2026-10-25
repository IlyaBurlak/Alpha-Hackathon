import { beforeEach, describe, expect, it, vi } from 'vitest'

import { StaffApplicationDetailStore, StaffApplicationListStore, restartStaffScoring } from '@/entities/staff-application'
import type { StaffApplication } from '@/entities/staff-application'
import { ApiError } from '@/shared/api'

import { RestartScoringStore } from './restart-scoring-store'

vi.mock('@/entities/staff-application', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/entities/staff-application')>()),
  restartStaffScoring: vi.fn(),
}))

const RESTARTED = { id: 'a1', status: 'scoring' } as StaffApplication

function createStore() {
  const list = new StaffApplicationListStore()
  const detail = new StaffApplicationDetailStore()
  vi.spyOn(list, 'replace')
  vi.spyOn(detail, 'replace')
  return { store: new RestartScoringStore(list, detail), list, detail }
}

beforeEach(() => {
  vi.mocked(restartStaffScoring).mockReset()
})

describe('RestartScoringStore', () => {
  it('asks for a confirmation first and can be cancelled', () => {
    const { store } = createStore()

    store.askConfirmation()
    expect(store.isConfirming).toBe(true)

    store.cancelConfirmation()
    expect(store.isConfirming).toBe(false)
  })

  it('shows the application the backend returns after the restart', async () => {
    vi.mocked(restartStaffScoring).mockResolvedValue(RESTARTED)
    const { store, list, detail } = createStore()
    store.askConfirmation()

    await expect(store.restart('a1')).resolves.toBe(RESTARTED)

    expect(restartStaffScoring).toHaveBeenCalledWith('a1')
    expect(list.replace).toHaveBeenCalledWith(RESTARTED)
    expect(detail.replace).toHaveBeenCalledWith(RESTARTED)
    expect(store).toMatchObject({ isSaving: false, isConfirming: false, errorMessage: null })
  })

  it('keeps the message of the backend when the restart fails', async () => {
    vi.mocked(restartStaffScoring).mockRejectedValue(new ApiError(500, 'Заявка не находится в статусе SUBMITTED'))
    const { store, list } = createStore()

    await expect(store.restart('a1')).resolves.toBeNull()

    expect(store).toMatchObject({ isSaving: false, isConfirming: false, errorMessage: 'Заявка не находится в статусе SUBMITTED' })
    expect(list.replace).not.toHaveBeenCalled()
  })

  it('does not start a second restart while one is running', async () => {
    let finish: (application: StaffApplication) => void = () => undefined
    vi.mocked(restartStaffScoring).mockReturnValue(new Promise((resolve) => (finish = resolve)))
    const { store } = createStore()

    const first = store.restart('a1')
    await expect(store.restart('a1')).resolves.toBeNull()
    finish(RESTARTED)
    await first

    expect(restartStaffScoring).toHaveBeenCalledTimes(1)
  })
})
