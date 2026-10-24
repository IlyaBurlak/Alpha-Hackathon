import { formatMonths } from '@/shared/lib'

import type { CreditTime } from '../../model/types'
import { getTermInMonths } from '../loan/loan-calculation'

/** The term in months whatever unit the backend used. */
export function formatCreditTime(creditTime: CreditTime): string {
  return formatMonths(getTermInMonths(creditTime))
}
