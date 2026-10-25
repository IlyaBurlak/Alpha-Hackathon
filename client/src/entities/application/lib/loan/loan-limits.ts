import type { BankProduct } from '../../api/bank-products'

export interface LoanLimits {
  minSum: number
  maxSum: number
  minTermInMonths: number
  maxTermInMonths: number
}

/**
 * The widest range the bank lends in to this kind of company: from the smallest sum or term of any of its products to
 * the largest. A product that starts at zero adds no limit of its own: the smallest positive start of the others is taken.
 * `null` when the bank has no product for the company.
 */
export function getLoanLimits(products: readonly BankProduct[], { isLegalEntity }: { isLegalEntity: boolean }): LoanLimits | null {
  const available = products.filter(({ isForLegalEntity, isForSoleProprietor }) => (isLegalEntity ? isForLegalEntity : isForSoleProprietor))
  if (available.length === 0) return null

  const smallestPositive = (values: readonly number[]): number | null => {
    const positive = values.filter((value) => value > 0)
    return positive.length > 0 ? Math.min(...positive) : null
  }
  const minSum = smallestPositive(available.map((product) => product.minSum)) ?? smallestPositive(available.map((product) => product.maxSum))
  const minTermInMonths = smallestPositive(available.map((product) => product.minTermInMonths))
  if (minSum === null || minTermInMonths === null) return null

  return {
    minSum,
    maxSum: Math.max(...available.map((product) => product.maxSum)),
    minTermInMonths,
    maxTermInMonths: Math.max(...available.map((product) => product.maxTermInMonths)),
  }
}
