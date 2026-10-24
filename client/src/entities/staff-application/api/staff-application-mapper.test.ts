import { describe, expect, it } from 'vitest'

import { UnexpectedResponseError } from '@/shared/api'

import { listMockStaffApplications, resetMockStaffDatabase } from './mocks/mock-staff-database'
import { mapStaffApplication, mapStaffApplications } from './staff-application-mapper'

const NOW = new Date('2026-10-24T12:00:00Z').getTime()

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

function createDtos() {
  Object.defineProperty(globalThis, 'localStorage', { value: new MemoryStorage(), configurable: true })
  resetMockStaffDatabase()
  return listMockStaffApplications(NOW)
}

describe('mapStaffApplication', () => {
  it('maps what the mock backend sends, dates included', () => {
    const [first] = mapStaffApplications(createDtos())

    expect(first.receivedAt).toBeInstanceOf(Date)
    expect(first.company.registeredAt).toBeInstanceOf(Date)
    expect(first).toMatchObject({ number: '204901', product: { shortName: 'Без залога' }, termInMonths: 24 })
    expect(first.scoring?.factors.length).toBeGreaterThan(0)
  })

  it('maps decisions of every kind', () => {
    const decisions = mapStaffApplications(createDtos()).flatMap((application) => (application.decision ? [application.decision] : []))

    expect(decisions.map((decision) => decision.type).sort()).toEqual(['approve', 'clarify', 'reject'])
    expect(decisions.find((decision) => decision.type === 'clarify')).toMatchObject({ documents: [expect.any(String)] })
  })

  it('maps an application that is still being scored', () => {
    const scoring = mapStaffApplications(createDtos()).find((application) => application.status === 'scoring')

    expect(scoring).toMatchObject({ scoring: null, recommendation: null, checks: [] })
  })

  it.each([
    ['not an object', null],
    ['an unknown status', { status: 'paused' }],
  ])('throws UnexpectedResponseError for %s', (_case, patch) => {
    const [dto] = createDtos()
    const broken = patch === null ? null : { ...dto, ...patch }

    expect(() => mapStaffApplication(broken)).toThrow(UnexpectedResponseError)
  })

  it('throws when the list is not a list', () => {
    expect(() => mapStaffApplications({})).toThrow(UnexpectedResponseError)
  })
})
