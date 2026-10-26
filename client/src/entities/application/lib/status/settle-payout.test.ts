import { describe, expect, it } from 'vitest'

import type { Application } from '../../model/types'
import { settlePayout } from './settle-payout'

function createApplication(overrides: Partial<Application>): Application {
  return {
    id: 1,
    organizationId: 1,
    sum: 1_000_000,
    status: 'SUBMITTED',
    createdAt: new Date(0),
    creditTime: { unit: 'MONTH', value: 12 },
    loanIssuanceDate: new Date(0),
    submittedAt: null,
    signedAt: null,
    issuedAt: null,
    goal: null,
    productChoice: { kind: 'not-selected' },
    scoring: null,
    reviewStage: null,
    specialOffer: null,
    operatorComment: null,
    ...overrides,
  }
}

describe('settlePayout', () => {
  const payout = createApplication({ status: 'PAYOUT', issuedAt: new Date(10_000) })

  it('issues the loan once the payout is over', () => {
    expect(settlePayout(payout, 10_000).status).toBe('ISSUED')
  })

  it('keeps the payout while it lasts and leaves other statuses alone', () => {
    expect(settlePayout(payout, 9_999)).toBe(payout)
    const approved = createApplication({ status: 'APPROVED' })
    expect(settlePayout(approved, 99_999)).toBe(approved)
  })
})
