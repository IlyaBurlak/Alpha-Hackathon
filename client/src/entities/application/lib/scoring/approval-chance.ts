const HIGH_FROM = 80
const GOOD_FROM = 60
const MEDIUM_FROM = 45

export type ApprovalChanceLevel = 1 | 2 | 3 | 4
export type ApprovalChanceTone = 'positive' | 'attention' | 'negative'

export interface ApprovalChance {
  label: string
  /** 1 (low) to 4 (high): how many bars of the chance meter are lit. */
  level: ApprovalChanceLevel
  tone: ApprovalChanceTone
}

export function getApprovalChance(score: number): ApprovalChance {
  if (score >= HIGH_FROM) return { label: 'Высокий', level: 4, tone: 'positive' }
  if (score >= GOOD_FROM) return { label: 'Хороший', level: 3, tone: 'positive' }
  if (score >= MEDIUM_FROM) return { label: 'Средний', level: 2, tone: 'attention' }
  return { label: 'Низкий', level: 1, tone: 'negative' }
}

/** A score from which the bank is expected to approve the application. */
export const APPROVAL_SCORE = GOOD_FROM
