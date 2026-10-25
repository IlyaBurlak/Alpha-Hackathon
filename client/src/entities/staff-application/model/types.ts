export const STAFF_STATUSES = {
  scoring: 'scoring',
  ready: 'ready',
  clarify: 'clarify',
  offer: 'offer',
  approved: 'approved',
  rejected: 'rejected',
} as const

export type StaffStatus = (typeof STAFF_STATUSES)[keyof typeof STAFF_STATUSES]

export const DECISION_TYPES = {
  approve: 'approve',
  offer: 'offer',
  clarify: 'clarify',
  reject: 'reject',
} as const

export type DecisionType = (typeof DECISION_TYPES)[keyof typeof DECISION_TYPES]

/** Where the scoring of an application stands: running, done, or finished without a usable result. */
export const SCORING_STATUSES = { pending: 'pending', ready: 'ready', unavailable: 'unavailable' } as const
export type ScoringStatus = (typeof SCORING_STATUSES)[keyof typeof SCORING_STATUSES]

export const CHECK_LEVELS = { ok: 'ok', warning: 'warning', fail: 'fail' } as const
export type CheckLevel = (typeof CHECK_LEVELS)[keyof typeof CHECK_LEVELS]

export const RISK_CLASSES = ['A', 'B', 'C', 'D', 'E'] as const
export type RiskClass = (typeof RISK_CLASSES)[number]

export const HISTORY_TONES = {
  info: 'info',
  positive: 'positive',
  attention: 'attention',
  negative: 'negative',
  neutral: 'neutral',
  default: 'default',
} as const
export type HistoryTone = (typeof HISTORY_TONES)[keyof typeof HISTORY_TONES]

export interface StaffProduct {
  id: string
  name: string
  /** Short name for the queue: "Без залога", "С залогом". */
  shortName: string
  isSecured: boolean
}

export interface StaffCompany {
  name: string
  inn: string
  /** Sole proprietors have no KPP. */
  kpp: string | null
  ogrn: string
  okved: string
  address: string
  head: string
  registeredAt: Date
  employeesCount: number
  annualRevenue: number
  debt: number
  /** Delays on credits over the last 12 months. */
  overdueCount: number
  hasStableTurnover: boolean
  arbitrationCases: number
  taxDebt: number
  /** The year the company became a client of the bank. */
  clientSince: number
  account: string
}

export interface StaffApplicant {
  name: string
  role: string
  phone: string
  email: string
}

export interface StaffCollateral {
  type: string
  value: number
  owner: string
}

/** What moved the score: `points` is how far the factor shifted it from the base level. */
export interface ScoringFactor {
  title: string
  description: string
  points: number
}

export interface StaffScoring {
  /** 0..100, higher is better. */
  score: number
  /** Probability of default, 0..1. */
  probabilityOfDefault: number
  riskClass: RiskClass
  /** Annual rate the model suggests, percent. */
  rate: number
  factors: ScoringFactor[]
  modelVersion: string
  updatedAt: Date
}

export interface CheckResult {
  title: string
  description: string
  level: CheckLevel
  /** The word on the right: "Пройдена", "Внимание", "Не пройдена". */
  resultLabel: string
}

export interface Recommendation {
  type: DecisionType
  reasons: string[]
  /** Suggested terms when the recommendation is to offer other conditions. */
  offer: { amount: number; termInMonths: number } | null
}

export interface MonthlyTurnover {
  /** Short month name: "окт". */
  month: string
  amount: number
}

export interface LoanLine {
  creditor: string
  balance: number
  monthlyPayment: number
  /** `null` when there are no delays. */
  overdue: string | null
}

export type Decision =
  | { type: 'approve'; comment: string }
  | { type: 'offer'; comment: string; amount: number; termInMonths: number; rate: number }
  | { type: 'clarify'; comment: string; documents: string[] }
  | { type: 'reject'; comment: string; reason: string }

export type RecordedDecision = Decision & { byEmployeeId: string; at: Date }

export interface HistoryEntry {
  at: Date
  title: string
  description: string | null
  tone: HistoryTone
}

export interface StaffApplication {
  id: string
  number: string
  receivedAt: Date
  status: StaffStatus
  assigneeId: string | null
  product: StaffProduct
  goal: string
  amount: number
  termInMonths: number
  company: StaffCompany
  applicant: StaffApplicant
  collateral: StaffCollateral | null
  /** `null` unless `scoringStatus` is `ready`. */
  scoring: StaffScoring | null
  scoringStatus: ScoringStatus
  /** Why a finished scoring has no result, for the employee; `null` otherwise. */
  scoringIssue: string | null
  checks: CheckResult[]
  recommendation: Recommendation | null
  turnover: MonthlyTurnover[]
  loans: LoanLine[]
  decision: RecordedDecision | null
  history: HistoryEntry[]
}
