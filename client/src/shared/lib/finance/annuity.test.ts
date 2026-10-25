import { describe, expect, it } from 'vitest'

import { calculateAnnuityPayment } from './annuity'

describe('calculateAnnuityPayment', () => {
  it('splits a zero-rate loan evenly', () => {
    expect(calculateAnnuityPayment(1200, 0, 12)).toBe(100)
  })

  it('calculates the payment of a loan with interest', () => {
    expect(calculateAnnuityPayment(100_000, 12, 12)).toBeCloseTo(8884.88, 2)
  })
})
