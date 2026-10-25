import { describe, expect, it } from 'vitest'

import type { ProductOffer, Scoring } from '../../model/types'
import { pickVariants } from './credit-variants'

function createOffer(overrides: Partial<ProductOffer>): ProductOffer {
  return {
    id: 1,
    name: 'Кредит',
    sum: 1_000_000,
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

const SCORING = (score: number): Scoring => ({ score, factors: [] })

describe('pickVariants', () => {
  it('takes the cheapest offer of each kind', () => {
    const offers = [
      createOffer({ id: 1, collateral: 120_000, interestRate: 10 }),
      createOffer({ id: 2, interestRate: 15 }),
      createOffer({ id: 3, collateral: 90_000, interestRate: 9 }),
      createOffer({ id: 4, interestRate: 5 }),
    ]

    const { plain, secured } = pickVariants(offers)

    expect(plain?.id).toBe(4)
    expect(secured?.id).toBe(3)
  })

  it('leaves a kind empty when the bank has no such offer', () => {
    const { plain, secured } = pickVariants([createOffer({ id: 2 })])

    expect(plain?.id).toBe(2)
    expect(secured).toBeNull()
  })

  it('returns nothing for no offers', () => {
    expect(pickVariants([])).toEqual({ plain: null, secured: null, recommended: null })
  })
})

describe('pickVariants: recommendation', () => {
  it('does not recommend anything without scoring', () => {
    const offers = [createOffer({ id: 1, collateral: 1000 }), createOffer({ id: 2 })]

    expect(pickVariants(offers).recommended).toBeNull()
  })

  it('recommends the variant without collateral when its chance is good', () => {
    const offers = [
      createOffer({ id: 1, collateral: 1000, scoring: SCORING(90) }),
      createOffer({ id: 2, scoring: SCORING(60) }),
    ]

    expect(pickVariants(offers).recommended).toBe('plain')
  })

  it('recommends collateral when the chance without it is low', () => {
    const offers = [
      createOffer({ id: 1, collateral: 1000, scoring: SCORING(70) }),
      createOffer({ id: 2, scoring: SCORING(50) }),
    ]

    expect(pickVariants(offers).recommended).toBe('secured')
  })

  it('falls back to the variant without collateral when it is the only one', () => {
    expect(pickVariants([createOffer({ id: 2, scoring: SCORING(30) })]).recommended).toBe('plain')
  })
})
