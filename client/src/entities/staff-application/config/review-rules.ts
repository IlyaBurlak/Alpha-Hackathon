/** The bank answers an application within this many hours; later it counts as overdue. */
export const SLA_HOURS = 24
/** Hours before the deadline at which the timer turns red. */
export const SLA_CRITICAL_HOURS = 4
/** Hours before the deadline at which the timer turns yellow. */
export const SLA_WARNING_HOURS = 10

/** Below this score the model advises to refuse. */
export const REFUSAL_SCORE_BELOW = 45
/** From this score and with every check passed the model advises to approve. */
export const AUTO_APPROVAL_SCORE_FROM = 75
/** The score of an average company before the factors move it. */
export const BASE_SCORE = 40

/** Limits shown in the finance block. */
export const AMOUNT_TO_REVENUE_LIMIT = 0.35
export const DEBT_TO_REVENUE_LIMIT = 0.3
export const PAYMENT_TO_MONTHLY_REVENUE_LIMIT = 0.2
export const LOAN_TO_COLLATERAL_LIMIT = 0.8

export const TERM_OPTIONS_IN_MONTHS = [6, 12, 18, 24, 36, 48, 60] as const
export const MIN_OFFER_AMOUNT = 100_000
export const MIN_COMMENT_LENGTH = 10
export const COMMENT_MAX_LENGTH = 400

export const DOCUMENT_REQUESTS = [
  'Бухгалтерская отчётность за последний год',
  'Выписки по счетам в других банках за 6 месяцев',
  'Документы на объект залога',
  'Доверенность заявителя',
  'Пояснение по арбитражным делам',
] as const

/** The reason that explains nothing by itself: the comment is then required. */
export const OTHER_REJECTION_REASON = 'Другое'

export const REJECTION_REASONS = [
  'Высокая долговая нагрузка',
  'Негативная кредитная история',
  'Недостаточная выручка',
  'Отрицательные результаты проверок',
  'Недостоверные данные в заявке',
  OTHER_REJECTION_REASON,
] as const
