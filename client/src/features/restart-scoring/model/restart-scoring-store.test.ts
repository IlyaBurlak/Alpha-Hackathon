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

const NO_WAIT = () => Promise.resolve()

function createStore() {
  const list = new StaffApplicationListStore()
  const detail = new StaffApplicationDetailStore()
  vi.spyOn(list, 'replace')
  vi.spyOn(detail, 'replace')
  const refresh = vi.spyOn(detail, 'refresh').mockResolvedValue()
  return { store: new RestartScoringStore(list, detail, NO_WAIT), list, detail, refresh }
}

function createScored(scoringStatus: 'pending' | 'ready', updatedAt: number | null): StaffApplication {
  return {
    id: 'a1',
    scoringStatus,
    scoring: updatedAt === null ? null : { updatedAt: new Date(updatedAt) },
  } as StaffApplication
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

describe('RestartScoringStore: waiting for the result', () => {
  /** Makes each look at the application show the next state, as the backend moves on. */
  function showInTurn(detail: StaffApplicationDetailStore, refresh: ReturnType<typeof vi.spyOn>, states: StaffApplication[]) {
    let index = 0
    refresh.mockImplementation(async () => {
      detail.replace(states[Math.min(index, states.length - 1)])
      index += 1
    })
  }

  it('waits while the scoring runs and stops when it has finished', async () => {
    const { store, detail, refresh } = createStore()
    vi.mocked(restartStaffScoring).mockResolvedValue(createScored('pending', null))
    showInTurn(detail, refresh, [createScored('pending', null), createScored('pending', null), createScored('ready', 2000)])

    await store.restart('a1')
    expect(store.isWaiting).toBe(true)

    await vi.waitFor(() => expect(store.isWaiting).toBe(false))
    expect(refresh).toHaveBeenCalledTimes(3)
  })

  it('takes a new result for the end of the wait when the old one was still shown at the first look', async () => {
    const { store, detail, refresh } = createStore()
    vi.mocked(restartStaffScoring).mockResolvedValue(createScored('ready', 1000))
    showInTurn(detail, refresh, [createScored('ready', 1000), createScored('ready', 2000)])

    await store.restart('a1')

    await vi.waitFor(() => expect(store.isWaiting).toBe(false))
    expect(refresh).toHaveBeenCalledTimes(2)
  })

  it('gives up after a few looks when nothing changes, so it never polls for good', async () => {
    const { store, detail, refresh } = createStore()
    vi.mocked(restartStaffScoring).mockResolvedValue(createScored('ready', 1000))
    showInTurn(detail, refresh, [createScored('ready', 1000)])

    await store.restart('a1')

    await vi.waitFor(() => expect(store.isWaiting).toBe(false))
    expect(refresh).toHaveBeenCalledTimes(10)
  })

  it('stops when the employee leaves the page', async () => {
    let release: () => void = () => undefined
    const list = new StaffApplicationListStore()
    const detail = new StaffApplicationDetailStore()
    const refresh = vi.spyOn(detail, 'refresh').mockResolvedValue()
    const store = new RestartScoringStore(list, detail, () => new Promise<void>((resolve) => (release = resolve)))
    vi.mocked(restartStaffScoring).mockResolvedValue(createScored('pending', null))

    await store.restart('a1')
    store.stopWaiting()
    release()
    await Promise.resolve()

    expect(store.isWaiting).toBe(false)
    expect(refresh).not.toHaveBeenCalled()
  })

  it('does not wait when the restart failed', async () => {
    const { store, refresh } = createStore()
    vi.mocked(restartStaffScoring).mockRejectedValue(new ApiError(500, 'Ошибка'))

    await store.restart('a1')

    expect(store.isWaiting).toBe(false)
    expect(refresh).not.toHaveBeenCalled()
  })
})

