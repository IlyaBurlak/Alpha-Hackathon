import { describe, expect, it } from 'vitest'

import { CREDIT_TIME_UNITS } from '../../model/types'
import {
  formatCreditTime,
  formatDate,
  formatLongDate,
  formatMoney,
  formatMoneyShort,
  formatMonths,
  formatPercent,
  formatWhen,
} from './format'

describe('formatMoney', () => {
  it('formats rubles without kopecks', () => {
    expect(formatMoney(1_000_000)).toMatch(/^1\s000\s000\s₽$/)
  })
})

describe('formatMoneyShort', () => {
  it('uses millions from one million up', () => {
    expect(formatMoneyShort(2_500_000)).toMatch(/^2,5\sмлн\s₽$/)
  })

  it('uses thousands below one million', () => {
    expect(formatMoneyShort(300_000)).toMatch(/^300\sтыс\s₽$/)
  })
})

describe('formatPercent', () => {
  it('always shows one decimal', () => {
    expect(formatPercent(5)).toBe('5,0%')
    expect(formatPercent(18.9)).toBe('18,9%')
  })
})

describe('formatDate', () => {
  it('formats a date in the Russian locale', () => {
    expect(formatDate(new Date(2026, 9, 23))).toBe('23.10.2026')
  })
})

describe('formatLongDate', () => {
  it('has no "г." and keeps the day with its month', () => {
    expect(formatLongDate(new Date(2026, 4, 12))).toBe('12\u00A0мая 2026')
  })
})

describe('formatWhen', () => {
  const now = new Date(2026, 9, 23, 18, 0)

  it('shows the time for today', () => {
    expect(formatWhen(new Date(2026, 9, 23, 14, 5), now)).toBe('сегодня, 14:05')
  })

  it('shows the long date for other days', () => {
    expect(formatWhen(new Date(2026, 4, 12, 10, 20), now)).toBe('12\u00A0мая 2026')
  })
})

describe('formatMonths', () => {
  it('declines the noun', () => {
    expect(formatMonths(1)).toMatch(/^1\sмесяц$/)
    expect(formatMonths(24)).toMatch(/^24\sмесяца$/)
    expect(formatMonths(36)).toMatch(/^36\sмесяцев$/)
  })
})

describe('formatCreditTime', () => {
  it('converts any unit to months', () => {
    expect(formatCreditTime({ value: 2, unit: CREDIT_TIME_UNITS.year })).toMatch(/^24\sмесяца$/)
    expect(formatCreditTime({ value: 6, unit: CREDIT_TIME_UNITS.month })).toMatch(/^6\sмесяцев$/)
  })
})
