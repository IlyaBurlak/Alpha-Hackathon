import { calculateLoan, getPaymentDate } from '@/entities/application'
import type { CreditVariants, LoanCalculation, ProductOffer, VariantKind } from '@/entities/application'

export const VARIANT_LABELS: Record<VariantKind, string> = {
  plain: 'Без залога',
  secured: 'С залогом',
}

export interface ComparedVariant {
  kind: VariantKind
  label: string
  offer: ProductOffer
  loan: LoanCalculation
  /** Paid to the bank by the end of each month; index 0 is the moment of issue. */
  cumulativePayments: number[]
}

export interface ComparisonDifference {
  /** Positive when the variant with collateral is cheaper. */
  overpayment: number
  monthlyPayment: number
  rate: number
}

export function buildComparison(variants: CreditVariants): ComparedVariant[] {
  const compared: ComparedVariant[] = []
  for (const kind of ['plain', 'secured'] as const) {
    const offer = variants[kind]
    if (offer === null) continue
    const loan = calculateLoan(offer)
    let paid = 0
    const cumulativePayments = [0, ...loan.schedule.map((row) => (paid += row.payment))]
    compared.push({ kind, label: VARIANT_LABELS[kind], offer, loan, cumulativePayments })
  }
  return compared
}

/** How much the variant with collateral wins; `null` unless both variants exist. */
export function getDifference(compared: readonly ComparedVariant[]): ComparisonDifference | null {
  const plain = compared.find(({ kind }) => kind === 'plain')
  const secured = compared.find(({ kind }) => kind === 'secured')
  if (!plain || !secured) return null
  return {
    overpayment: plain.loan.totalInterest - secured.loan.totalInterest,
    monthlyPayment: plain.loan.monthlyPayment - secured.loan.monthlyPayment,
    rate: plain.offer.interestRate - secured.offer.interestRate,
  }
}

/** Payment dates of the longest variant: the rows of the combined schedule table. */
export function getScheduleDates(compared: readonly ComparedVariant[], startDate: Date): Date[] {
  const longest = compared.reduce((max, variant) => Math.max(max, variant.loan.schedule.length), 0)
  return Array.from({ length: longest }, (_, index) => getPaymentDate(startDate, index + 1))
}
