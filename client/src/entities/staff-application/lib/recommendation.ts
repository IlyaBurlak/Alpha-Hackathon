import { formatPercent } from '@/shared/lib'

import { AUTO_APPROVAL_SCORE_FROM, REFUSAL_SCORE_BELOW } from '../config/review-rules'
import { CHECK_LEVELS, DECISION_TYPES } from '../model/types'
import type { CheckResult, Recommendation, StaffScoring } from '../model/types'

const PERCENT = 100

function describeCheck({ title, description }: CheckResult): string {
  return `${title}: ${description.toLowerCase()}`
}

/**
 * The advice of the system from the result of the model and the checks, by the zones of the model: below
 * `REFUSAL_SCORE_BELOW` refuse, from `AUTO_APPROVAL_SCORE_FROM` approve when every check is clear, in between the
 * employee decides alone and there is no advice.
 */
export function recommendDecision(
  scoring: Pick<StaffScoring, 'score' | 'riskClass' | 'probabilityOfDefault' | 'factors'>,
  checks: readonly CheckResult[],
): Recommendation | null {
  const failedChecks = checks.filter(({ level }) => level === CHECK_LEVELS.fail)
  const hasWarnings = checks.some(({ level }) => level === CHECK_LEVELS.warning)
  const isBelowThreshold = scoring.score < REFUSAL_SCORE_BELOW

  if (failedChecks.length > 0 || isBelowThreshold) {
    const reasons = failedChecks.map(describeCheck)
    if (isBelowThreshold) reasons.push(`Балл ${scoring.score} ниже порога ${REFUSAL_SCORE_BELOW}`)
    const negativeFactors = scoring.factors.filter(({ points }) => points < 0)
    reasons.push(...negativeFactors.map(({ title, description }) => `${title}: ${description}`))
    return { type: DECISION_TYPES.reject, reasons, offer: null }
  }

  if (scoring.score >= AUTO_APPROVAL_SCORE_FROM && !hasWarnings) {
    return {
      type: DECISION_TYPES.approve,
      reasons: [
        `Балл ${scoring.score}, класс ${scoring.riskClass}`,
        'Все проверки пройдены',
        `Вероятность дефолта ${formatPercent(scoring.probabilityOfDefault * PERCENT)}`,
      ],
      offer: null,
    }
  }
  return null
}
