/**
 * Turns what the backend sends to an operator (`/applications/all`, `/applications/:id/score`) into the shape the
 * staff mapper reads. The scoring comes only from the ML result the backend sends (ml-scoring.ts): without it the
 * report says so. The figures of the company the backend does not send yet (turnover, credit lines) are filled in from
 * the mock review (api/mocks/mock-review.ts); whatever the backend sends wins (docs/frontend-mocks.md).
 */
import { UnexpectedResponseError, readNumber, readRecord, readString } from '@/shared/api'
import { isRecord } from '@/shared/lib'

import { OTHER_REJECTION_REASON, REJECTION_REASONS } from '../../config/review-rules'
import { HISTORY_TONES, STAFF_STATUSES } from '../../model/types'
import type { StaffStatus } from '../../model/types'
import { recommendDecision } from '../../lib/recommendation'
import { buildChecks, buildLoans, buildTurnover } from '../mocks/mock-review'
import type { ReviewInput } from '../mocks/mock-review'
import { SCORING_PENDING, readMlScoring } from './ml-scoring'

const MONTHS_IN_YEAR = 12
const DAYS_IN_MONTH = 30
const UNKNOWN = '—'
const NAME_NOT_RECEIVED = 'Название не получено'
const SCORING_IN_PROGRESS = ['PENDINGCRREDITHISTORY', 'PENDINGREGISTER', 'WAITNGSCORING']
const REVENUE_TO_AMOUNT_FALLBACK = 4
const UNSTABLE_MONTH_SHARE = 0.3
const OPERATOR_ID_PREFIX = 'op'
/** The backend does not record the reason of a refusal separately; it is the start of the comment. */
const REASON_SEPARATOR = '. '

type Source = Record<string, unknown>

function optionalNumber(source: Source, key: string): number | null {
  const value = source[key]
  return typeof value === 'number' && !Number.isNaN(value) ? value : null
}

function optionalString(source: Source, key: string): string | null {
  const value = source[key]
  return typeof value === 'string' && value !== '' ? value : null
}

function optionalRecord(source: Source, key: string): Source | null {
  const value = source[key]
  return isRecord(value) && Object.keys(value).length > 0 ? value : null
}

/** Months in a credit time of the backend (`{ units: 'MONTH' | 'DAY' | 'YEAR', value }`). */
export function creditTimeToMonths(value: unknown): number {
  const time = readRecord(value, 'credit time')
  const amount = readNumber(time, 'value')
  switch (readString(time, 'units')) {
    case 'YEAR':
      return amount * MONTHS_IN_YEAR
    case 'DAY':
      return Math.max(1, Math.round(amount / DAYS_IN_MONTH))
    default:
      return amount
  }
}

export function operatorToEmployeeId(operatorId: number): string {
  return `${OPERATOR_ID_PREFIX}${operatorId}`
}

function mapStatus(applicationStatus: string, scoringStatus: string | null): StaffStatus | null {
  switch (applicationStatus) {
    case 'SUBMITTED':
      return scoringStatus === null || SCORING_IN_PROGRESS.includes(scoringStatus) ? STAFF_STATUSES.scoring : STAFF_STATUSES.ready
    case 'APPROVED':
    case 'SPECIALPRODUCTACCEPTED':
    case 'SIGNED':
      return STAFF_STATUSES.approved
    case 'REJECTED':
    case 'SPECIALPRODUCTREJECTED':
      return STAFF_STATUSES.rejected
    case 'SPECIALPRODUCTOFFERED':
      return STAFF_STATUSES.offer
    default:
      return null
  }
}

/** The backend has no collateral flag in the application: the product name is the only hint. */
function isSecuredProduct(name: string): boolean {
  return /залог/i.test(name) && !/без залог/i.test(name)
}

function mapProduct(application: Source) {
  const product = optionalRecord(application, 'product')
  const name = (product && optionalString(product, 'name')) ?? 'Продукт не выбран'
  const isGovernment = /господдерж/i.test(name)
  const isSecured = isSecuredProduct(name)
  const shortName = isGovernment ? 'Господдержка' : isSecured ? 'С залогом' : 'Без залога'
  return {
    id: String(optionalNumber(application, 'productId') ?? 'none'),
    name,
    shortName,
    isSecured,
    rate: product && optionalNumber(product, 'persentage'),
    reviewProductId: isGovernment ? 'gov' : isSecured ? 'line' : 'any',
  }
}

function unpaidDebt(history: Source | null): number {
  const items = history?.creditHistory
  const list = Array.isArray(items) ? items : isRecord(items) ? [items] : []
  return list.reduce<number>((total, item) => {
    if (!isRecord(item) || item.status === 'PAID') return total
    return total + (optionalNumber(item, 'sum') ?? 0)
  }, 0)
}

function lastYearBalances(register: Source | null): number[] {
  const balances = register?.lastYearBalances
  if (!Array.isArray(balances)) return []
  return balances.filter((balance): balance is number => typeof balance === 'number').slice(-MONTHS_IN_YEAR)
}

function hasStableTurnover(balances: readonly number[]): boolean {
  if (balances.length === 0) return true
  const average = balances.reduce((total, balance) => total + balance, 0) / balances.length
  return balances.every((balance) => balance >= average * UNSTABLE_MONTH_SHARE)
}

function monthName(monthsAgo: number, now: number): string {
  const today = new Date(now)
  const month = new Date(today.getFullYear(), today.getMonth() - monthsAgo, 1)
  return month.toLocaleDateString('ru-RU', { month: 'short' }).replace('.', '')
}

function toIso(moment: number): string {
  return new Date(moment).toISOString()
}

/** The signed documents say nothing about what was signed: the terms of an offer in the product tell the two apart. */
function getDecidedStatus(application: Source, status: string): string {
  if (status !== 'SIGNED') return status
  const product = optionalRecord(application, 'product')
  return product && optionalNumber(product, 'sum') !== null ? 'SPECIALPRODUCTACCEPTED' : 'APPROVED'
}

function mapDecision(application: Source, backendStatus: string, assigneeId: string | null, receivedAt: string) {
  const status = getDecidedStatus(application, backendStatus)
  const comment = optionalString(application, 'solutionComment') ?? ''
  const base = { byEmployeeId: assigneeId ?? UNKNOWN, at: receivedAt, comment }
  switch (status) {
    case 'APPROVED':
      return { type: 'approve', ...base }
    case 'REJECTED': {
      // The comment is the reason alone, or the reason, a separator and the words of the employee.
      const reason = REJECTION_REASONS.find((candidate) => comment === candidate || comment.startsWith(`${candidate}${REASON_SEPARATOR}`))
      return {
        type: 'reject',
        ...base,
        reason: reason ?? OTHER_REJECTION_REASON,
        comment: reason ? comment.slice(reason.length + REASON_SEPARATOR.length) : comment,
      }
    }
    case 'SPECIALPRODUCTOFFERED':
    case 'SPECIALPRODUCTACCEPTED':
    case 'SPECIALPRODUCTREJECTED': {
      const product = optionalRecord(application, 'product')
      return {
        type: 'offer',
        ...base,
        amount: (product && optionalNumber(product, 'sum')) ?? readNumber(application, 'sum'),
        termInMonths: product?.creditTime ? creditTimeToMonths(product.creditTime) : creditTimeToMonths(application.creditTime),
        rate: (product && optionalNumber(product, 'persentage')) ?? 0,
      }
    }
    default:
      return null
  }
}

function describeDecisionOutcome(status: string): string | null {
  switch (status) {
    case 'APPROVED':
      return 'Заявка одобрена'
    case 'REJECTED':
      return 'Заявке отказано'
    case 'SPECIALPRODUCTOFFERED':
      return 'Клиенту предложены другие условия'
    case 'SPECIALPRODUCTACCEPTED':
      return 'Клиент принял другие условия'
    case 'SPECIALPRODUCTREJECTED':
      return 'Клиент отказался от других условий'
    case 'SIGNED':
      return 'Клиент подписал договор'
    default:
      return null
  }
}

const OUTCOME_TONES: Record<string, string> = {
  SIGNED: HISTORY_TONES.positive,
  APPROVED: HISTORY_TONES.default,
  REJECTED: HISTORY_TONES.negative,
  SPECIALPRODUCTOFFERED: HISTORY_TONES.attention,
  SPECIALPRODUCTACCEPTED: HISTORY_TONES.positive,
  SPECIALPRODUCTREJECTED: HISTORY_TONES.negative,
}

/**
 * `value` is an application of the backend; the `/score` form carries the register and credit bureau data
 * (`applicationScore.registerInfo` and `.history`), the form of `/all` does not and gets placeholders.
 * Returns `null` for drafts: the employee does not see applications the client has not sent.
 */
export function toStaffApplicationDto(value: unknown, now: number) {
  const application = readRecord(value, 'application')
  const backendStatus = readString(application, 'status')
  const score = optionalRecord(application, 'applicationScore')
  const status = mapStatus(backendStatus, score && optionalString(score, 'status'))
  if (status === null) return null

  const id = readNumber(application, 'id')
  const amount = readNumber(application, 'sum')
  const receivedAt = new Date(readString(application, 'createdAt')).getTime()
  if (Number.isNaN(receivedAt)) throw new UnexpectedResponseError('"createdAt" is not a date')
  const receivedAtIso = toIso(receivedAt)
  const operator = optionalRecord(application, 'operator')
  const assigneeId = operator ? operatorToEmployeeId(readNumber(operator, 'id')) : null
  const termInMonths = creditTimeToMonths(application.creditTime)

  const register = score && optionalRecord(score, 'registerInfo')
  const history = score && optionalRecord(score, 'history')
  const balances = lastYearBalances(register)
  const annualRevenue = (register && optionalNumber(register, 'annualIncome')) ?? amount * REVENUE_TO_AMOUNT_FALLBACK
  const registeredAt = (register && optionalString(register, 'registrationDate')) ?? receivedAtIso
  const head = (register && optionalString(register, 'head')) ?? UNKNOWN
  const product = mapProduct(application)
  const organization = optionalRecord(application, 'organization')
  const isSoleProprietor =
    (organization && optionalString(organization, 'type')) === 'IndividualEntrepreneur' || (register && optionalString(register, 'type')) === 'ИП'
  // The name and the INN come only from the organization of the application; no placeholder with a number stands for them.
  const company = {
    name: (organization && optionalString(organization, 'fullName')) ?? NAME_NOT_RECEIVED,
    inn: (organization && optionalString(organization, 'inn')) ?? UNKNOWN,
    kpp: isSoleProprietor ? null : register && optionalString(register, 'kpp'),
    ogrn: (register && optionalString(register, 'ogrn')) ?? UNKNOWN,
    okved: (register && optionalString(register, 'okved')) ?? UNKNOWN,
    address: (register && optionalString(register, 'address')) ?? UNKNOWN,
    head,
    registeredAt,
    employeesCount: (register && optionalNumber(register, 'employeesCount')) ?? 0,
    annualRevenue,
    debt: unpaidDebt(history),
    overdueCount: (history && optionalNumber(history, 'casesDelayedPayment')) ?? 0,
    hasStableTurnover: hasStableTurnover(balances),
    arbitrationCases: 0,
    taxDebt: 0,
    clientSince: new Date((register && optionalString(register, 'bankClientSince')) ?? registeredAt).getFullYear(),
    account: (register && optionalString(register, 'account')) ?? UNKNOWN,
  }

  const input: ReviewInput = {
    productId: product.reviewProductId,
    isSecured: product.isSecured,
    amount,
    termInMonths,
    inn: company.inn,
    registeredAt: new Date(registeredAt).getTime(),
    annualRevenue,
    debt: company.debt,
    overdueCount: company.overdueCount,
    hasStableTurnover: company.hasStableTurnover,
    arbitrationCases: 0,
    taxDebt: 0,
    collateralValue: null,
    isCompanyActive: register?.isActive !== false,
    isBankrupt: history?.bankrupt === true,
  }
  const reading = status === STAFF_STATUSES.scoring ? SCORING_PENDING : readMlScoring(score && optionalRecord(score, 'mlScore'), product.rate)
  const { scoring } = reading
  const checks = status === STAFF_STATUSES.scoring ? [] : buildChecks(input, scoring?.rate ?? null)
  const outcome = describeDecisionOutcome(backendStatus)

  const entries: { at: string; title: string; description: string | null; tone: string }[] = [
    { at: receivedAtIso, title: 'Заявка поступила из кредитного кабинета', description: null, tone: HISTORY_TONES.info },
  ]
  if (operator) {
    entries.push({
      at: receivedAtIso,
      title: 'Назначен ответственный',
      description: optionalString(operator, 'fullName'),
      tone: HISTORY_TONES.neutral,
    })
  }
  if (outcome) {
    entries.push({
      at: receivedAtIso,
      title: outcome,
      description: optionalString(application, 'solutionComment'),
      tone: OUTCOME_TONES[backendStatus] ?? HISTORY_TONES.neutral,
    })
  }

  return {
    id: String(id),
    number: String(id).padStart(6, '0'),
    receivedAt: receivedAtIso,
    status,
    assigneeId,
    product: { id: product.id, name: product.name, shortName: product.shortName, isSecured: product.isSecured },
    goal: UNKNOWN,
    amount,
    termInMonths,
    company,
    applicant: { name: head, role: UNKNOWN, phone: UNKNOWN, email: UNKNOWN },
    collateral: null,
    scoring,
    scoringStatus: reading.status,
    scoringIssue: reading.issue,
    checks,
    recommendation: scoring ? recommendDecision(scoring, checks) : null,
    turnover:
      balances.length === MONTHS_IN_YEAR
        ? balances.map((amountOfMonth, index) => ({ month: monthName(MONTHS_IN_YEAR - index, now), amount: amountOfMonth }))
        : buildTurnover(input, now),
    loans: buildLoans(input),
    decision: mapDecision(application, backendStatus, assigneeId, receivedAtIso),
    history: entries,
  }
}
