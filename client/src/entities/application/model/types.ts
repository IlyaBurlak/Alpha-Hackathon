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
} as const

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[keyof typeof APPLICATION_STATUSES]

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
}

export interface SelectedProduct {
  name: string
  interestRate: number
  payments: string
}

/**
 * - `selected`: the product is chosen, the application went to review.
 * - `offers`: the product is not chosen yet; `items` may be empty when nothing fits.
 * - `not-selected`: the product is not chosen and offers are unknown (bank services are unavailable).
 */
export type ProductChoice =
  | { kind: 'selected'; product: SelectedProduct }
  | { kind: 'offers'; items: ProductOffer[] }
  | { kind: 'not-selected' }

export interface Application {
  id: number
  organizationId: number
  sum: number
  status: ApplicationStatus
  createdAt: Date
  creditTime: CreditTime
  loanIssuanceDate: Date
  productChoice: ProductChoice
}

export interface CreateApplicationInput {
  organizationId: number
  sum: number
  creditTime: CreditTime
}
