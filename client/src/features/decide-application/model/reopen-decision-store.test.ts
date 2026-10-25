import { beforeEach, describe, expect, it, vi } from 'vitest'

import { StaffApplicationDetailStore, StaffApplicationListStore, reopenStaffApplication } from '@/entities/staff-application'
import type { StaffApplication } from '@/entities/staff-application'
import { ApiError } from '@/shared/api'

import { ReopenDecisionStore } from './reopen-decision-store'

vi.mock('@/entities/staff-application', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/entities/staff-application')>()),
  reopenStaffApplication: vi.fn(),
}))

const ACTOR = { id: 'u1', name: 'Мария Иванова' }

beforeEach(() => {
  vi.mocked(reopenStaffApplication).mockReset()
})

describe('ReopenDecisionStore', () => {
  it('takes the decision back and shows the fresh application', async () => {
    const reopened = { id: 'a1', status: 'ready' } as StaffApplication
    vi.mocked(reopenStaffApplication).mockResolvedValue(reopened)
    const list = new StaffApplicationListStore()
    const detail = new StaffApplicationDetailStore()
    const replaceDetail = vi.spyOn(detail, 'replace')
    const store = new ReopenDecisionStore(list, detail)

    expect(await store.reopen('a1', ACTOR)).toBe(reopened)

    expect(reopenStaffApplication).toHaveBeenCalledWith('a1', ACTOR)
    expect(replaceDetail).toHaveBeenCalledWith(reopened)
    expect(store.isSaving).toBe(false)
  })

  it('shows the error and stays usable', async () => {
    vi.mocked(reopenStaffApplication).mockRejectedValue(new ApiError(500, 'Заявка не найдена'))
    const store = new ReopenDecisionStore(new StaffApplicationListStore(), new StaffApplicationDetailStore())

    expect(await store.reopen('a1', ACTOR)).toBeNull()

    expect(store.errorMessage).toBe('Заявка не найдена')
    expect(store.isSaving).toBe(false)
  })
})
