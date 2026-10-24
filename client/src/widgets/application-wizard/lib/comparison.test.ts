import { describe, expect, it } from 'vitest'

import type { ProductOffer } from '@/entities/application'

import { buildComparison, getDifference, getScheduleDates } from './comparison'

function createOffer(overrides: Partial<ProductOffer>): ProductOffer {
  return {
    id: 1,
    name: 'Кредит',
    sum: 1_200_000,
    creditTime: { unit: 'MONTH', value: 12 },
    collateral: 0,
    interestRate: 15,
    payments: 'ежемесячно',
    description: null,
    decisionTime: null,
    scoring: null,
    ...overrides,
  }
}

const PLAIN = createOffer({ id: 2, interestRate: 15 })
const SECURED = createOffer({ id: 1, collateral: 50_000, interestRate: 10 })
const LONG_SECURED = { ...SECURED, creditTime: { unit: 'MONTH', value: 24 } } as const

describe('buildComparison', () => {
  it('builds the available variants with cumulative payments', () => {
    const [plain] = buildComparison({ plain: PLAIN, secured: null, recommended: null })

    expect(plain.label).toBe('Без залога')
    expect(plain.cumulativePayments).toHaveLength(13)
    expect(plain.cumulativePayments[0]).toBe(0)
    expect(plain.cumulativePayments[12]).toBeCloseTo(plain.loan.totalPayout, 4)
  })

  it('keeps the order: without collateral first', () => {
    const compared = buildComparison({ plain: PLAIN, secured: SECURED, recommended: null })

    expect(compared.map(({ kind }) => kind)).toEqual(['plain', 'secured'])
  })

  it('is empty without variants', () => {
    expect(buildComparison({ plain: null, secured: null, recommended: null })).toEqual([])
  })
})

describe('getDifference', () => {
  it('is null unless both variants exist', () => {
    expect(getDifference(buildComparison({ plain: PLAIN, secured: null, recommended: null }))).toBeNull()
  })

  it('shows how much cheaper the variant with collateral is', () => {
    const difference = getDifference(buildComparison({ plain: PLAIN, secured: SECURED, recommended: null }))

    expect(difference?.rate).toBe(5)
    expect(difference?.overpayment).toBeGreaterThan(0)
  })
})

describe('getScheduleDates', () => {
  it('covers the longest variant', () => {
    const compared = buildComparison({ plain: PLAIN, secured: LONG_SECURED, recommended: null })

    expect(getScheduleDates(compared, new Date(2026, 0, 15))).toHaveLength(24)
  })
})
