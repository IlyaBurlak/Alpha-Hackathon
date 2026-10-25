import { calculateLoan, getPaymentDate } from '@/entities/application'
import type { CreditVariants, LoanCalculation, ProductOffer } from '@/entities/application'

/** The colours that tell the offers apart in charts and tables, in the order the offers are shown; they repeat after the last. */
export const VARIANT_TONES = ['first', 'second', 'third', 'fourth'] as const
export type VariantTone = (typeof VARIANT_TONES)[number]

export function getVariantTone(index: number): VariantTone {
  return VARIANT_TONES[index % VARIANT_TONES.length]
}

export interface ComparedVariant {
  id: number
  /** The name of the product: the offers differ by product, not by one of two kinds. */
  label: string
  tone: VariantTone
  offer: ProductOffer
  loan: LoanCalculation
  /** Paid to the bank by the end of each month; index 0 is the moment of issue. */
  cumulativePayments: number[]
}

export interface ComparisonDifference {
  /** The offer with the smallest overpayment and the one with the largest. */
  cheapest: ComparedVariant
  priciest: ComparedVariant
  overpayment: number
  monthlyPayment: number
  rate: number
}

export function buildComparison({ offers }: CreditVariants): ComparedVariant[] {
  return offers.map((offer, index) => {
    const loan = calculateLoan(offer)
    let paid = 0
    const cumulativePayments = [0, ...loan.schedule.map((row) => (paid += row.payment))]
    return { id: offer.id, label: offer.name, tone: getVariantTone(index), offer, loan, cumulativePayments }
  })
}

/** How much the cheapest offer wins against the most expensive one; `null` with fewer than two offers. */
export function getDifference(compared: readonly ComparedVariant[]): ComparisonDifference | null {
  if (compared.length < 2) return null
  const byOverpayment = [...compared].sort((first, second) => first.loan.totalInterest - second.loan.totalInterest)
  const cheapest = byOverpayment[0]
  const priciest = byOverpayment[byOverpayment.length - 1]
  return {
    cheapest,
    priciest,
    overpayment: priciest.loan.totalInterest - cheapest.loan.totalInterest,
    monthlyPayment: priciest.loan.monthlyPayment - cheapest.loan.monthlyPayment,
    rate: priciest.offer.interestRate - cheapest.offer.interestRate,
  }
}

/** Payment dates of the longest variant: the rows of the combined schedule table. */
export function getScheduleDates(compared: readonly ComparedVariant[], startDate: Date): Date[] {
  const longest = compared.reduce((max, variant) => Math.max(max, variant.loan.schedule.length), 0)
  return Array.from({ length: longest }, (_, index) => getPaymentDate(startDate, index + 1))
}
