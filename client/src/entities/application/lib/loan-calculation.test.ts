import { describe, expect, it } from 'vitest'

import { CREDIT_TIME_UNITS } from '../model/types'
import { calculateLoan, getTermInMonths } from './loan-calculation'

describe('getTermInMonths', () => {
  it('converts years, months and days to months', () => {
    expect(getTermInMonths({ value: 2, unit: CREDIT_TIME_UNITS.year })).toBe(24)
    expect(getTermInMonths({ value: 7, unit: CREDIT_TIME_UNITS.month })).toBe(7)
    expect(getTermInMonths({ value: 45, unit: CREDIT_TIME_UNITS.day })).toBe(2)
  })

  it('is at least one month', () => {
    expect(getTermInMonths({ value: 1, unit: CREDIT_TIME_UNITS.day })).toBe(1)
  })
})

describe('calculateLoan', () => {
  it('splits a zero-rate loan evenly', () => {
    const result = calculateLoan({
      sum: 1200,
      interestRate: 0,
      creditTime: { value: 12, unit: CREDIT_TIME_UNITS.month },
    })

    expect(result.monthlyPayment).toBe(100)
    expect(result.totalInterest).toBe(0)
    expect(result.schedule).toHaveLength(12)
  })

  it('calculates an annuity payment', () => {
    const result = calculateLoan({
      sum: 100_000,
      interestRate: 12,
      creditTime: { value: 1, unit: CREDIT_TIME_UNITS.year },
    })

    expect(result.monthlyPayment).toBeCloseTo(8884.88, 2)
    expect(result.totalPayout).toBeCloseTo(106_618.55, 1)
    expect(result.totalInterest).toBeCloseTo(6618.55, 1)
  })

  it('repays the whole principal by the last month', () => {
    const { schedule } = calculateLoan({
      sum: 500_000,
      interestRate: 9.5,
      creditTime: { value: 3, unit: CREDIT_TIME_UNITS.year },
    })
    const totalPrincipal = schedule.reduce((total, row) => total + row.principal, 0)

    expect(totalPrincipal).toBeCloseTo(500_000, 4)
    expect(schedule.at(-1)?.balance).toBe(0)
  })
})
