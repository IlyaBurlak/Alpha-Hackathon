/**
 * MOCK: a database of the staff queue that lives in the browser (`localStorage`) and stands in for the backend:
 * it holds the applications, assigns them, records decisions and finishes scoring with time
 * (docs/frontend-mocks.md). The functions return what the backend is expected to send, as plain JSON-like objects.
 */
import { isRecord, jsonStorage } from '@/shared/lib'

import { DECISION_OPTIONS } from '../../config/decisions'
import { DOCUMENT_REQUESTS } from '../../config/review-rules'
import { HISTORY_TONES, STAFF_STATUSES } from '../../model/types'
import type { Decision, HistoryTone, StaffStatus } from '../../model/types'
import { buildChecks, buildLoans, buildRecommendation, buildScoring, buildTurnover } from './mock-review'
import type { ReviewInput } from './mock-review'
import {
  ASSIGNMENT_DELAY_IN_MINUTES,
  MOCK_PRODUCTS,
  SCORING_DURATION_IN_MINUTES,
  SCORING_STEP_IN_MS,
  SEEDED_DECISION_DELAY_IN_HOURS,
  SEED_HOUR,
  createSeedRecords,
} from './mock-staff-seeds'
import type { SeedRecord } from './mock-staff-seeds'

const STORAGE_KEY = 'staff-mock-database-v1'
const MS_IN_MINUTE = 60_000

/** Names of the employees the seeds mention in the history. */
const SEED_EMPLOYEE_NAMES: Record<string, string> = { u1: 'Мария Иванова', u2: 'Дмитрий Орлов', u3: 'Елена Ким' }

interface StoredHistoryEntry {
  at: number
  title: string
  description: string | null
  tone: HistoryTone
}

interface StoredDecision {
  type: Decision['type']
  byEmployeeId: string
  at: number
  comment: string
  amount?: number
  termInMonths?: number
  rate?: number
  documents?: string[]
  reason?: string
}

export interface StoredRecord extends Omit<SeedRecord, 'status'> {
  status: StaffStatus
  decision: StoredDecision | null
  history: StoredHistoryEntry[]
}

interface DatabaseState {
  records: StoredRecord[]
}

export interface Actor {
  id: string
  name: string
}

function getReviewInput(record: StoredRecord): ReviewInput {
  const product = MOCK_PRODUCTS[record.productId]
  return {
    productId: record.productId,
    isSecured: product.isSecured,
    amount: record.amount,
    termInMonths: record.termInMonths,
    inn: record.company.inn,
    registeredAt: new Date(record.company.registeredAt).getTime(),
    annualRevenue: record.company.annualRevenue,
    debt: record.company.debt,
    overdueCount: record.company.overdueCount,
    hasStableTurnover: record.company.hasStableTurnover,
    arbitrationCases: record.company.arbitrationCases,
    taxDebt: record.company.taxDebt,
    collateralValue: record.collateral?.value ?? null,
    isCompanyActive: true,
    isBankrupt: false,
  }
}

function describeScoring(record: StoredRecord, now: number): string {
  const scoring = buildScoring(getReviewInput(record), now)
  return `Балл ${scoring.score}, класс ${scoring.riskClass}`
}

const DECISION_TONES: Partial<Record<StaffStatus, HistoryTone>> = {
  [STAFF_STATUSES.approved]: HISTORY_TONES.default,
  [STAFF_STATUSES.rejected]: HISTORY_TONES.negative,
  [STAFF_STATUSES.clarify]: HISTORY_TONES.attention,
  [STAFF_STATUSES.offer]: HISTORY_TONES.attention,
}

function createSeedDecision(record: StoredRecord): StoredDecision | null {
  const byEmployeeId = record.assigneeId ?? ''
  const at = record.receivedAt + (SEEDED_DECISION_DELAY_IN_HOURS[record.status] ?? 0) * SEED_HOUR
  if (record.status === STAFF_STATUSES.approved) return { type: 'approve', byEmployeeId, at, comment: '' }
  if (record.status === STAFF_STATUSES.rejected) {
    return {
      type: 'reject',
      byEmployeeId,
      at,
      reason: 'Негативная кредитная история',
      comment: 'Просрочки по текущим кредитам и высокая нагрузка.',
    }
  }
  if (record.status === STAFF_STATUSES.clarify) {
    return {
      type: 'clarify',
      byEmployeeId,
      at,
      documents: [DOCUMENT_REQUESTS[1]],
      comment: 'Пришлите выписки по счетам в других банках, чтобы подтвердить выручку.',
    }
  }
  return null
}

function createSeedHistory(record: StoredRecord, now: number): StoredHistoryEntry[] {
  const history: StoredHistoryEntry[] = [
    { at: record.receivedAt, title: 'Заявка поступила из кредитного кабинета', description: null, tone: HISTORY_TONES.info },
  ]
  if (record.status !== STAFF_STATUSES.scoring) {
    history.push({
      at: record.receivedAt + SCORING_DURATION_IN_MINUTES * MS_IN_MINUTE,
      title: 'Скоринг завершён',
      description: describeScoring(record, now),
      tone: HISTORY_TONES.positive,
    })
  }
  if (record.assigneeId) {
    history.push({
      at: record.receivedAt + ASSIGNMENT_DELAY_IN_MINUTES * MS_IN_MINUTE,
      title: 'Назначен ответственный',
      description: SEED_EMPLOYEE_NAMES[record.assigneeId] ?? null,
      tone: HISTORY_TONES.neutral,
    })
  }
  if (record.decision) {
    history.push({
      at: record.decision.at,
      title: DECISION_OPTIONS[record.decision.type].historyTitle,
      description: SEED_EMPLOYEE_NAMES[record.decision.byEmployeeId] ?? null,
      tone: DECISION_TONES[record.status] ?? HISTORY_TONES.neutral,
    })
  }
  return history
}

function createInitialState(now: number): DatabaseState {
  let scoringIndex = 0
  const records = createSeedRecords(now).map((seed) => {
    const record: StoredRecord = { ...seed, status: seed.status, decision: null, history: [] }
    if (record.status === STAFF_STATUSES.scoring) {
      scoringIndex += 1
      record.scoringReadyAt = now + scoringIndex * SCORING_STEP_IN_MS
    }
    record.decision = createSeedDecision(record)
    record.history = createSeedHistory(record, now)
    return record
  })
  return { records }
}

let memoryState: DatabaseState | null = null

/** A cheap check that a stored value is a record this module wrote; anything else makes the database start over. */
function isStoredRecord(value: unknown): value is StoredRecord {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.status === 'string' &&
    typeof value.productId === 'string' &&
    isRecord(value.company) &&
    isRecord(value.applicant) &&
    Array.isArray(value.history)
  )
}

function readState(): DatabaseState | null {
  const stored = jsonStorage.read(STORAGE_KEY)
  if (!isRecord(stored) || !Array.isArray(stored.records) || !stored.records.every(isStoredRecord)) return null
  return { records: stored.records }
}

function loadState(now: number): DatabaseState {
  memoryState ??= readState() ?? createInitialState(now)
  return memoryState
}

function saveState(state: DatabaseState): void {
  memoryState = state
  jsonStorage.write(STORAGE_KEY, state)
}

/** Scoring that has finished by `now` moves its application to "ready" and the history says so. */
function finishScoring(state: DatabaseState, now: number): boolean {
  let hasChanged = false
  for (const record of state.records) {
    if (record.status !== STAFF_STATUSES.scoring || record.scoringReadyAt === null || now < record.scoringReadyAt) continue
    record.status = STAFF_STATUSES.ready
    record.history.push({
      at: record.scoringReadyAt,
      title: 'Скоринг завершён',
      description: describeScoring(record, now),
      tone: HISTORY_TONES.positive,
    })
    hasChanged = true
  }
  return hasChanged
}

function toIso(moment: number): string {
  return new Date(moment).toISOString()
}

/** The application the way the backend is expected to send it to the staff cabinet. */
export function toStaffApplicationDto(record: StoredRecord, now: number) {
  const input = getReviewInput(record)
  const isScored = record.status !== STAFF_STATUSES.scoring
  const scoring = isScored ? buildScoring(input, now) : null
  const checks = scoring ? buildChecks(input, scoring.rate) : []
  const { decision } = record
  return {
    id: record.id,
    number: record.number,
    receivedAt: toIso(record.receivedAt),
    status: record.status,
    assigneeId: record.assigneeId,
    product: MOCK_PRODUCTS[record.productId],
    goal: record.goal,
    amount: record.amount,
    termInMonths: record.termInMonths,
    company: record.company,
    applicant: record.applicant,
    collateral: record.collateral,
    scoring,
    checks,
    recommendation: scoring ? buildRecommendation(input, scoring, checks) : null,
    turnover: buildTurnover(input, now),
    loans: buildLoans(input),
    decision: decision && { ...decision, at: toIso(decision.at) },
    history: record.history.map((entry) => ({ ...entry, at: toIso(entry.at) })),
  }
}

export function listMockStaffApplications(now: number = Date.now()) {
  const state = loadState(now)
  if (finishScoring(state, now)) saveState(state)
  return state.records.map((record) => toStaffApplicationDto(record, now))
}

function findRecord(state: DatabaseState, id: string): StoredRecord {
  const record = state.records.find((candidate) => candidate.id === id)
  if (!record) throw new Error('Заявка не найдена')
  return record
}

export function getMockStaffApplication(id: string, now: number = Date.now()) {
  const state = loadState(now)
  if (finishScoring(state, now)) saveState(state)
  return toStaffApplicationDto(findRecord(state, id), now)
}

export function assignMockStaffApplication(id: string, assignee: Actor | null, now: number = Date.now()) {
  const state = loadState(now)
  const record = findRecord(state, id)
  record.assigneeId = assignee?.id ?? null
  record.history.push({
    at: now,
    title: assignee ? 'Назначен ответственный' : 'Ответственный снят',
    description: assignee?.name ?? null,
    tone: HISTORY_TONES.neutral,
  })
  saveState(state)
  return toStaffApplicationDto(record, now)
}

export function decideMockStaffApplication(id: string, decision: Decision, actor: Actor, now: number = Date.now()) {
  const state = loadState(now)
  const record = findRecord(state, id)
  const option = DECISION_OPTIONS[decision.type]
  const { type, comment, ...details } = decision
  record.decision = { type, comment, ...details, byEmployeeId: actor.id, at: now }
  record.status = option.resultingStatus
  record.assigneeId ??= actor.id
  record.history.push({
    at: now,
    title: option.historyTitle,
    description: comment ? `${actor.name}. ${comment}` : actor.name,
    tone: DECISION_TONES[record.status] ?? HISTORY_TONES.neutral,
  })
  saveState(state)
  return toStaffApplicationDto(record, now)
}

export function reopenMockStaffApplication(id: string, actor: Actor, now: number = Date.now()) {
  const state = loadState(now)
  const record = findRecord(state, id)
  record.status = STAFF_STATUSES.ready
  record.decision = null
  record.history.push({ at: now, title: 'Решение отменено для пересмотра', description: actor.name, tone: HISTORY_TONES.neutral })
  saveState(state)
  return toStaffApplicationDto(record, now)
}

/** For tests: forget everything kept in memory and in the browser. */
export function resetMockStaffDatabase(): void {
  memoryState = null
  jsonStorage.remove(STORAGE_KEY)
}
