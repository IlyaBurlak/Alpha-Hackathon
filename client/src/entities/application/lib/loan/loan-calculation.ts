import { CREDIT_TIME_UNITS } from '../../model/types'
import type { CreditTime } from '../../model/types'

const MONTHS_IN_YEAR = 12
const DAYS_IN_MONTH = 30
const PERCENT_DIVISOR = 100
/** Payments fall on the same day of the month, but never later than the 28th: every month has it. */
const LAST_SAFE_PAYMENT_DAY = 28

export interface LoanInput {
  sum: number
  /** Annual interest rate, percent. */
  interestRate: number
  creditTime: CreditTime
}

export interface PaymentScheduleRow {
  month: number
  payment: number
  principal: number
  interest: number
  balance: number
}

export interface LoanCalculation {
  monthlyPayment: number
  totalPayout: number
  totalInterest: number
  schedule: PaymentScheduleRow[]
}

export function getTermInMonths({ value, unit }: CreditTime): number {
  const months = {
    [CREDIT_TIME_UNITS.year]: value * MONTHS_IN_YEAR,
    [CREDIT_TIME_UNITS.month]: value,
    [CREDIT_TIME_UNITS.day]: Math.ceil(value / DAYS_IN_MONTH),
  }[unit]
  return Math.max(months, 1)
}

/** Date of the payment number `month` (1-based) for a loan issued on `startDate`. */
export function getPaymentDate(startDate: Date, month: number): Date {
  return new Date(startDate.getFullYear(), startDate.getMonth() + month, Math.min(startDate.getDate(), LAST_SAFE_PAYMENT_DAY))
}

function getMonthlyPayment(sum: number, monthlyRate: number, months: number): number {
  if (monthlyRate === 0) return sum / months
  return (sum * monthlyRate) / (1 - (1 + monthlyRate) ** -months)
}

/**
 * Estimates an annuity loan: equal monthly payments, interest accrued monthly.
 * The backend does not send the schedule, and its payment-terms text ("first payment in 6 months")
 * is free-form, so a grace period is not modelled.
 */
export function calculateLoan({ sum, interestRate, creditTime }: LoanInput): LoanCalculation {
  const months = getTermInMonths(creditTime)
  const monthlyRate = interestRate / PERCENT_DIVISOR / MONTHS_IN_YEAR
  const monthlyPayment = getMonthlyPayment(sum, monthlyRate, months)

  const schedule: PaymentScheduleRow[] = []
  let balance = sum
  for (let month = 1; month <= months; month += 1) {
    const interest = balance * monthlyRate
    const principal = monthlyPayment - interest
    balance = month === months ? 0 : balance - principal
    schedule.push({
      month,
      payment: monthlyPayment,
      principal,
      interest,
      balance,
    })
  }

  const totalPayout = monthlyPayment * months
  return {
    monthlyPayment,
    totalPayout,
    totalInterest: totalPayout - sum,
    schedule,
  }
}
