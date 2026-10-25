import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { ApiError } from '@/shared/api'

import { assignMockStaffApplication, resetMockStaffDatabase } from './mocks/mock-staff-database'
import { decideStaffApplication } from './staff-applications'

class MemoryStorage {
  private readonly values = new Map<string, string>()

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }

  removeItem(key: string): void {
    this.values.delete(key)
  }
}

const OWNER = { id: 'u1', name: 'Мария Иванова' }
const COLLEAGUE = { id: 'u2', name: 'Дмитрий Орлов' }
/** An application nobody works on in the demo database. */
const FREE_APPLICATION = 'a204902'

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', { value: new MemoryStorage(), configurable: true })
  resetMockStaffDatabase()
})

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'localStorage')
  resetMockStaffDatabase()
})

describe('decideStaffApplication: the responsible employee', () => {
  it('does not let anyone decide an application nobody took', async () => {
    await expect(decideStaffApplication(FREE_APPLICATION, { type: 'approve', comment: '' }, OWNER)).rejects.toMatchObject({
      status: 409,
      message: 'Заявка никому не назначена. Сначала возьмите её в работу.',
    })
  })

  it('does not let another employee decide an application that was taken', async () => {
    assignMockStaffApplication(FREE_APPLICATION, OWNER)

    const attempt = decideStaffApplication(FREE_APPLICATION, { type: 'approve', comment: '' }, COLLEAGUE)

    await expect(attempt).rejects.toBeInstanceOf(ApiError)
    await expect(attempt).rejects.toMatchObject({ message: 'Решение по заявке принимает её ответственный.' })
  })

  it('lets the responsible employee decide', async () => {
    assignMockStaffApplication(FREE_APPLICATION, OWNER)

    const decided = await decideStaffApplication(FREE_APPLICATION, { type: 'approve', comment: '' }, OWNER)

    expect(decided).toMatchObject({ status: 'approved', assigneeId: 'u1' })
  })
})
