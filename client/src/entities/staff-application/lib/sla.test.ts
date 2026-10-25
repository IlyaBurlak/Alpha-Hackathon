import { describe, expect, it } from 'vitest'

import type { StaffStatus } from '../model/types'
import { getSla } from './sla'

const HOUR = 3_600_000
const NOW = new Date('2026-10-24T12:00:00Z').getTime()

function received(hoursAgo: number, status: StaffStatus = 'ready') {
  return { status, receivedAt: new Date(NOW - hoursAgo * HOUR) }
}

describe('getSla', () => {
  it('counts down from 24 hours and turns yellow, then red', () => {
    expect(getSla(received(1), NOW)).toMatchObject({ label: '23 ч 0 мин', tone: 'positive' })
    expect(getSla(received(15), NOW)).toMatchObject({ label: '9 ч 0 мин', tone: 'attention' })
    expect(getSla(received(21), NOW)).toMatchObject({ label: '3 ч 0 мин', tone: 'negative' })
  })

  it('shows only minutes in the last hour', () => {
    expect(getSla({ status: 'ready', receivedAt: new Date(NOW - 23.5 * HOUR) }, NOW)?.label).toBe('30 мин')
  })

  it('reports an overdue application', () => {
    expect(getSla(received(30), NOW)).toEqual({ label: 'Просрочено', tone: 'negative', progress: 1, isOverdue: true })
  })

  it('tracks how much of the time is gone', () => {
    expect(getSla(received(12), NOW)?.progress).toBeCloseTo(0.5)
  })

  it('waits for the client on a clarification', () => {
    expect(getSla(received(5, 'clarify'), NOW)).toMatchObject({ label: 'Ждём клиента', tone: 'neutral', progress: 0 })
  })

  it.each(['approved', 'rejected', 'offer'] as const)('has no deadline once the status is %s', (status) => {
    expect(getSla(received(5, status), NOW)).toBeNull()
  })
})
