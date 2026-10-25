import type { CreditGoalId } from '../config/loan-form'

export const CREDIT_TIME_UNITS = {
  day: 'DAY',
  month: 'MONTH',
  year: 'YEAR',
} as const

export type CreditTimeUnit = (typeof CREDIT_TIME_UNITS)[keyof typeof CREDIT_TIME_UNITS]

export interface CreditTime {
  unit: CreditTimeUnit
  value: number
}

export const APPLICATION_STATUSES = {
  draft: 'DRAFT',
  submitted: 'SUBMITTED',
  approved: 'APPROVED',
  rejected: 'REJECTED',
  /** The employee offered other conditions; the user accepts or declines them. */
  offered: 'SPECIALPRODUCTOFFERED',
  offerAccepted: 'SPECIALPRODUCTACCEPTED',
  offerDeclined: 'SPECIALPRODUCTREJECTED',
  /** All documents are signed, the bank is to credit the money (`PUT /applications/:id/sign`). */
  signed: 'SIGNED',
  /** The statuses below are not sent by the backend yet; see docs/frontend-mocks.md. */
  payout: 'PAYOUT',
  issued: 'ISSUED',
} as const

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[keyof typeof APPLICATION_STATUSES]

/** One reason behind a scoring result; `points` is positive when it raised the score. */
export interface ScoringFactor {
  title: string
  description: string
  points: number
  /** What the applicant can do to improve it; set for negative factors. */
  advice: string | null
}

/** Preliminary approval estimate: `score` is 0..100, higher means a better chance. */
export interface Scoring {
  score: number
  factors: ScoringFactor[]
}

/** Product proposed by the bank for an application, with terms calculated for its sum and term. */
export interface ProductOffer {
  id: number
  name: string
  sum: number
  creditTime: CreditTime
  collateral: number
  /** Annual interest rate, percent. */
  interestRate: number
  payments: string
  /** What the product is for, a sentence for the card. */
  description: string | null
  /** How long the bank takes to decide, e.g. "За 1 день". */
  decisionTime: string | null
  scoring: Scoring | null
}

export interface SelectedProduct {
  name: string
  interestRate: number
  payments: string
}

/** Other conditions offered by an employee instead of the requested ones. */
export interface SpecialOffer {
  sum: number
  creditTime: CreditTime
  /** Annual interest rate, percent. */
  interestRate: number
  payments: string
}

/**
 * - `selected`: the product is chosen, the application went to review.
 * - `offers`: a draft whose product is not chosen yet; `items` may be empty when nothing fits.
 * - `not-selected`: the product is unknown (a draft while bank services are unavailable, or a sent
 *   application the backend does not describe).
 */
export type ProductChoice =
  | { kind: 'selected'; product: SelectedProduct }
  | { kind: 'offers'; items: ProductOffer[] }
  | { kind: 'not-selected' }

/** Stage of the bank review: 0 data check, 1 credit history request, 2 risk estimate. */
export type ReviewStage = 0 | 1 | 2

export interface Application {
  id: number
  organizationId: number
  sum: number
  status: ApplicationStatus
  createdAt: Date
  creditTime: CreditTime
  loanIssuanceDate: Date
  /** When the application was sent to the bank. */
  submittedAt: Date | null
  /** When the user signed the contract. */
  signedAt: Date | null
  /** When the money reached the account. */
  issuedAt: Date | null
  /** The backend does not store the goal; it is kept in the browser. */
  goal: CreditGoalId | null
  productChoice: ProductChoice
  scoring: Scoring | null
  reviewStage: ReviewStage | null
  /** Set once an employee offered other conditions (also after the user answered). */
  specialOffer: SpecialOffer | null
  /** What the employee wrote with the decision. */
  operatorComment: string | null
}

export interface CreateApplicationInput {
  organizationId: number
  sum: number
  creditTime: CreditTime
  goal: CreditGoalId
}
