import { describe, expect, it } from 'vitest'

import { APPLICATION_STATUSES, CREDIT_TIME_UNITS } from '../model/types'
import { APPLICATION_STATUS_LABELS, CREDIT_TIME_UNIT_LABELS, formatCreditTime, formatDate, formatMoney } from './format'

describe('formatMoney', () => {
  it('formats rubles without kopecks', () => {
    expect(formatMoney(1_000_000)).toMatch(/^1\s000\s000\s₽$/)
  })
})

describe('formatDate', () => {
  it('formats a date in the Russian locale', () => {
    expect(formatDate(new Date(2026, 9, 23))).toBe('23.10.2026')
  })
})

describe('formatCreditTime', () => {
  it('joins value and unit label', () => {
    expect(formatCreditTime({ value: 6, unit: CREDIT_TIME_UNITS.month })).toBe('6 мес.')
  })
})

describe('labels', () => {
  it('has a label for every credit time unit and application status', () => {
    expect(Object.keys(CREDIT_TIME_UNIT_LABELS).sort()).toEqual(Object.values(CREDIT_TIME_UNITS).sort())
    expect(Object.keys(APPLICATION_STATUS_LABELS).sort()).toEqual(Object.values(APPLICATION_STATUSES).sort())
  })
})
