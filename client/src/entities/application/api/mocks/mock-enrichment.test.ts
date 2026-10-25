import { describe, expect, it } from 'vitest'

import type { LocalApplicationDetails } from '../../lib/local-details/local-details'
import type { Application, ProductOffer } from '../../model/types'
import { PAYOUT_DURATION_MS, applyMocks, settlePayout } from './mock-enrichment'

const NO_DETAILS: LocalApplicationDetails = {
  goal: null,
  selectedProduct: null,
  isSecured: false,
  submittedAt: null,
  withdrawnAt: null,
  signedAt: null,
  isDiscarded: false,
}

const OFFER: ProductOffer = {
  id: 2,
  name: 'Кредит для бизнеса без залогов',
  sum: 1_000_000,
  creditTime: { unit: 'MONTH', value: 12 },
  collateral: 0,
  interestRate: 15,
  payments: 'ежемесячно',
  description: null,
  decisionTime: null,
  scoring: null,
}

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

const NOW = 1_000_000_000

describe('applyMocks: offers', () => {
  it('adds description, decision time and scoring to offers of a draft', () => {
    const application = createApplication({ status: 'DRAFT', productChoice: { kind: 'offers', items: [OFFER] } })

    const { productChoice, scoring } = applyMocks(application, NO_DETAILS, NOW)

    expect(productChoice.kind === 'offers' && productChoice.items[0]).toMatchObject({
      description: 'Без залога и подтверждения целей',
      decisionTime: 'За 1 день',
    })
    expect(productChoice.kind === 'offers' && productChoice.items[0].scoring?.score).toBeGreaterThan(0)
    expect(scoring).toBeNull()
  })

  it('keeps what the backend sent', () => {
    const sent = { ...OFFER, description: 'От банка', decisionTime: 'Сразу', scoring: { score: 1, factors: [] } }
    const application = createApplication({ status: 'DRAFT', productChoice: { kind: 'offers', items: [sent] } })

    expect(applyMocks(application, NO_DETAILS, NOW).productChoice).toEqual({ kind: 'offers', items: [sent] })
  })
})

describe('applyMocks: review', () => {
  const submittedAt = NOW - 1000

  it('moves through the review stages with time', () => {
    const details = { ...NO_DETAILS, submittedAt }

    expect(applyMocks(createApplication({}), details, submittedAt + 1000).reviewStage).toBe(0)
    expect(applyMocks(createApplication({}), details, submittedAt + 3500).reviewStage).toBe(1)
    expect(applyMocks(createApplication({}), details, submittedAt + 60_000).reviewStage).toBe(2)
  })

  it('has no stage without a sending moment, and keeps the backend stage', () => {
    expect(applyMocks(createApplication({}), NO_DETAILS, NOW).reviewStage).toBeNull()
    expect(applyMocks(createApplication({ reviewStage: 2 }), NO_DETAILS, NOW).reviewStage).toBe(2)
  })

  it('estimates scoring for a sent application', () => {
    expect(applyMocks(createApplication({}), NO_DETAILS, NOW).scoring?.factors.length).toBeGreaterThan(0)
  })
})

describe('applyMocks: user actions', () => {
  it('shows a withdrawn application that was under review', () => {
    const details = { ...NO_DETAILS, withdrawnAt: NOW }

    expect(applyMocks(createApplication({}), details, NOW).status).toBe('WITHDRAWN')
  })

  it('does not withdraw a decided application', () => {
    const details = { ...NO_DETAILS, withdrawnAt: NOW }

    expect(applyMocks(createApplication({ status: 'REJECTED' }), details, NOW).status).toBe('REJECTED')
  })

  it('pays out after signing and then marks the loan as issued', () => {
    const details = { ...NO_DETAILS, signedAt: NOW }
    const approved = createApplication({ status: 'APPROVED' })

    expect(applyMocks(approved, details, NOW + 1000).status).toBe('PAYOUT')

    const issued = applyMocks(approved, details, NOW + PAYOUT_DURATION_MS)
    expect(issued.status).toBe('ISSUED')
    expect(issued.issuedAt).toEqual(new Date(NOW + PAYOUT_DURATION_MS))
  })

  it('ignores a signature of an application that is not approved', () => {
    expect(applyMocks(createApplication({}), { ...NO_DETAILS, signedAt: NOW }, NOW).status).toBe('SUBMITTED')
  })
})

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
