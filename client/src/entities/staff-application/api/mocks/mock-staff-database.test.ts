import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type { Decision } from '../../model/types'
import {
  assignMockStaffApplication,
  decideMockStaffApplication,
  getMockStaffApplication,
  listMockStaffApplications,
  reopenMockStaffApplication,
  resetMockStaffDatabase,
} from './mock-staff-database'

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

const NOW = new Date('2026-10-24T12:00:00Z').getTime()
const ACTOR = { id: 'u1', name: 'Мария Иванова' }

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', { value: new MemoryStorage(), configurable: true })
  resetMockStaffDatabase()
})

afterEach(() => {
  resetMockStaffDatabase()
  Reflect.deleteProperty(globalThis, 'localStorage')
})

describe('the mock staff database', () => {
  it('starts with the twelve applications of the design in their statuses', () => {
    const applications = listMockStaffApplications(NOW)
    const statuses = applications.map((application) => application.status)

    expect(applications).toHaveLength(12)
    expect(statuses.filter((status) => status === 'scoring')).toHaveLength(2)
    expect(statuses).toContain('approved')
    expect(statuses).toContain('rejected')
    expect(statuses).toContain('clarify')
  })

  it('has no scoring, checks or recommendation while the model is calculating', () => {
    const scoring = listMockStaffApplications(NOW).find((application) => application.id === 'a204910')

    expect(scoring).toMatchObject({ status: 'scoring', scoring: null, checks: [], recommendation: null })
  })

  it('finishes scoring with time and writes it to the history', () => {
    listMockStaffApplications(NOW)
    const later = NOW + 30_000

    const application = getMockStaffApplication('a204910', later)

    expect(application.status).toBe('ready')
    expect(application.scoring).not.toBeNull()
    expect(application.history.at(-1)).toMatchObject({ title: 'Скоринг завершён' })
  })

  it('assigns and unassigns an application, writing the history', () => {
    const assigned = assignMockStaffApplication('a204902', ACTOR, NOW)
    expect(assigned.assigneeId).toBe('u1')
    expect(assigned.history.at(-1)).toMatchObject({ title: 'Назначен ответственный', description: 'Мария Иванова' })

    const released = assignMockStaffApplication('a204902', null, NOW + 1000)
    expect(released.assigneeId).toBeNull()
    expect(released.history.at(-1)?.title).toBe('Ответственный снят')
  })

  it('records a decision of the responsible employee and keeps the comment in the history', () => {
    assignMockStaffApplication('a204902', ACTOR, NOW)

    const decided = decideMockStaffApplication('a204902', { type: 'reject', reason: 'Недостаточная выручка', comment: 'Выручка мала для суммы' }, ACTOR, NOW)

    expect(decided).toMatchObject({ status: 'rejected', assigneeId: 'u1' })
    expect(decided.decision).toMatchObject({ type: 'reject', reason: 'Недостаточная выручка', byEmployeeId: 'u1' })
    expect(decided.history.at(-1)).toMatchObject({ title: 'Отказ по заявке', description: 'Мария Иванова. Выручка мала для суммы' })
  })

  const DECISIONS: Array<[Decision, string]> = [
    [{ type: 'approve', comment: '' }, 'approved'],
    [{ type: 'offer', comment: '', amount: 2_000_000, termInMonths: 18, rate: 17.5 }, 'offer'],
    [{ type: 'clarify', comment: 'Пришлите выписки', documents: ['Доверенность заявителя'] }, 'clarify'],
  ]

  it.each(DECISIONS)('moves the application to the status of the %j decision', (decision, status) => {
    expect(decideMockStaffApplication('a204901', decision, ACTOR, NOW).status).toBe(status)
  })

  it('reopens a decided application for review', () => {
    decideMockStaffApplication('a204901', { type: 'approve', comment: '' }, ACTOR, NOW)

    const reopened = reopenMockStaffApplication('a204901', ACTOR, NOW + 1000)

    expect(reopened).toMatchObject({ status: 'ready', decision: null })
    expect(reopened.history.at(-1)?.title).toBe('Решение отменено для пересмотра')
  })

  it('keeps changes between reads, and fails on an unknown application', () => {
    assignMockStaffApplication('a204902', ACTOR, NOW)

    expect(getMockStaffApplication('a204902', NOW).assigneeId).toBe('u1')
    expect(() => getMockStaffApplication('nope', NOW)).toThrow('Заявка не найдена')
  })
})
