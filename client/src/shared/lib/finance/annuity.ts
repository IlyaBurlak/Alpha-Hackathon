const MONTHS_IN_YEAR = 12
const PERCENT_DIVISOR = 100

/** Monthly payment of an annuity loan: equal payments, interest accrued monthly on the remaining debt. */
export function calculateAnnuityPayment(sum: number, annualRatePercent: number, months: number): number {
  const monthlyRate = annualRatePercent / PERCENT_DIVISOR / MONTHS_IN_YEAR
  if (monthlyRate === 0) return sum / months
  return (sum * monthlyRate) / (1 - (1 + monthlyRate) ** -months)
}
