import { beforeEach, describe, expect, it, vi } from 'vitest'

import { assignStaffApplication, StaffApplicationDetailStore, StaffApplicationListStore } from '@/entities/staff-application'
import type { StaffApplication } from '@/entities/staff-application'
import { ApiError } from '@/shared/api'

import { AssignmentStore } from './assignment-store'

vi.mock('@/entities/staff-application', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/entities/staff-application')>()),
  assignStaffApplication: vi.fn(),
}))

const EMPLOYEE = { id: 'u1', login: 'ivanova', name: 'Мария Иванова', initials: 'МИ', position: 'Кредитный аналитик' }
const UPDATED = { id: 'a1', assigneeId: 'u1' } as StaffApplication

beforeEach(() => {
  vi.mocked(assignStaffApplication).mockReset()
})

describe('AssignmentStore', () => {
  it('assigns an employee and puts the fresh application into the list and the detail', async () => {
    vi.mocked(assignStaffApplication).mockResolvedValue(UPDATED)
    const list = new StaffApplicationListStore()
    const detail = new StaffApplicationDetailStore()
    const replaceList = vi.spyOn(list, 'replace')
    const replaceDetail = vi.spyOn(detail, 'replace')
    const store = new AssignmentStore(list, detail)

    expect(await store.assign('a1', EMPLOYEE)).toBe(UPDATED)

    expect(assignStaffApplication).toHaveBeenCalledWith('a1', { id: 'u1', name: 'Мария Иванова' })
    expect(replaceList).toHaveBeenCalledWith(UPDATED)
    expect(replaceDetail).toHaveBeenCalledWith(UPDATED)
    expect(store.isSaving).toBe(false)
  })

  it('removes the responsible employee with null', async () => {
    vi.mocked(assignStaffApplication).mockResolvedValue({ id: 'a1', assigneeId: null } as StaffApplication)

    await new AssignmentStore(new StaffApplicationListStore()).assign('a1', null)

    expect(assignStaffApplication).toHaveBeenCalledWith('a1', null)
  })

  it('shows the error and stays usable', async () => {
    vi.mocked(assignStaffApplication).mockRejectedValue(new ApiError(500, 'Заявка не найдена'))
    const store = new AssignmentStore(new StaffApplicationListStore())

    expect(await store.assign('a1', EMPLOYEE)).toBeNull()

    expect(store.errorMessage).toBe('Заявка не найдена')
    expect(store.isSaving).toBe(false)
  })
})
