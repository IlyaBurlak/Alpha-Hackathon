import {
  UnexpectedResponseError,
  readArray,
  readBoolean,
  readDate,
  readNumber,
  readOneOf,
  readOptionalString,
  readRecord,
  readString,
} from '@/shared/api'

import {
  CHECK_LEVELS,
  DECISION_TYPES,
  HISTORY_TONES,
  RISK_CLASSES,
  STAFF_STATUSES,
} from '../model/types'
import type {
  CheckResult,
  Decision,
  HistoryEntry,
  LoanLine,
  MonthlyTurnover,
  Recommendation,
  RecordedDecision,
  ScoringFactor,
  StaffApplicant,
  StaffApplication,
  StaffCollateral,
  StaffCompany,
  StaffProduct,
  StaffScoring,
} from '../model/types'

const STATUS_VALUES = Object.values(STAFF_STATUSES)
const DECISION_VALUES = Object.values(DECISION_TYPES)
const CHECK_LEVEL_VALUES = Object.values(CHECK_LEVELS)
const HISTORY_TONE_VALUES = Object.values(HISTORY_TONES)

function mapList<Item>(value: unknown, description: string, mapItem: (item: unknown) => Item): Item[] {
  return readArray(value, description).map(mapItem)
}

function mapProduct(value: unknown): StaffProduct {
  const dto = readRecord(value, 'product')
  return {
    id: readString(dto, 'id'),
    name: readString(dto, 'name'),
    shortName: readString(dto, 'shortName'),
    isSecured: readBoolean(dto, 'isSecured'),
  }
}

function mapCompany(value: unknown): StaffCompany {
  const dto = readRecord(value, 'company')
  return {
    name: readString(dto, 'name'),
    inn: readString(dto, 'inn'),
    kpp: readOptionalString(dto, 'kpp'),
    ogrn: readString(dto, 'ogrn'),
    okved: readString(dto, 'okved'),
    address: readString(dto, 'address'),
    head: readString(dto, 'head'),
    registeredAt: readDate(dto, 'registeredAt'),
    employeesCount: readNumber(dto, 'employeesCount'),
    annualRevenue: readNumber(dto, 'annualRevenue'),
    debt: readNumber(dto, 'debt'),
    overdueCount: readNumber(dto, 'overdueCount'),
    hasStableTurnover: readBoolean(dto, 'hasStableTurnover'),
    arbitrationCases: readNumber(dto, 'arbitrationCases'),
    taxDebt: readNumber(dto, 'taxDebt'),
    clientSince: readNumber(dto, 'clientSince'),
    account: readString(dto, 'account'),
  }
}

function mapApplicant(value: unknown): StaffApplicant {
  const dto = readRecord(value, 'applicant')
  return { name: readString(dto, 'name'), role: readString(dto, 'role'), phone: readString(dto, 'phone'), email: readString(dto, 'email') }
}

function mapCollateral(value: unknown): StaffCollateral | null {
  if (value === null || value === undefined) return null
  const dto = readRecord(value, 'collateral')
  return { type: readString(dto, 'type'), value: readNumber(dto, 'value'), owner: readString(dto, 'owner') }
}

function mapFactor(value: unknown): ScoringFactor {
  const dto = readRecord(value, 'scoring factor')
  return { title: readString(dto, 'title'), description: readString(dto, 'description'), points: readNumber(dto, 'points') }
}

function mapScoring(value: unknown): StaffScoring | null {
  if (value === null || value === undefined) return null
  const dto = readRecord(value, 'scoring')
  return {
    score: readNumber(dto, 'score'),
    probabilityOfDefault: readNumber(dto, 'probabilityOfDefault'),
    riskClass: readOneOf(dto, 'riskClass', RISK_CLASSES),
    rate: readNumber(dto, 'rate'),
    factors: mapList(dto.factors, 'scoring factors', mapFactor),
    modelVersion: readString(dto, 'modelVersion'),
    updatedAt: readDate(dto, 'updatedAt'),
  }
}

function mapCheck(value: unknown): CheckResult {
  const dto = readRecord(value, 'check')
  return {
    title: readString(dto, 'title'),
    description: readString(dto, 'description'),
    level: readOneOf(dto, 'level', CHECK_LEVEL_VALUES),
    resultLabel: readString(dto, 'resultLabel'),
  }
}

function mapRecommendation(value: unknown): Recommendation | null {
  if (value === null || value === undefined) return null
  const dto = readRecord(value, 'recommendation')
  const offer = dto.offer === null || dto.offer === undefined ? null : readRecord(dto.offer, 'recommended offer')
  return {
    type: readOneOf(dto, 'type', DECISION_VALUES),
    reasons: readStringList(dto.reasons, 'recommendation reasons'),
    offer: offer && { amount: readNumber(offer, 'amount'), termInMonths: readNumber(offer, 'termInMonths') },
  }
}

function mapTurnover(value: unknown): MonthlyTurnover {
  const dto = readRecord(value, 'turnover month')
  return { month: readString(dto, 'month'), amount: readNumber(dto, 'amount') }
}

function mapLoan(value: unknown): LoanLine {
  const dto = readRecord(value, 'loan')
  return {
    creditor: readString(dto, 'creditor'),
    balance: readNumber(dto, 'balance'),
    monthlyPayment: readNumber(dto, 'monthlyPayment'),
    overdue: readOptionalString(dto, 'overdue'),
  }
}

function readStringList(value: unknown, description: string): string[] {
  return mapList(value, description, (item) => {
    if (typeof item !== 'string') throw new UnexpectedResponseError(`${description}: an item is not a string`)
    return item
  })
}

function mapDecisionBody(dto: Record<string, unknown>): Decision {
  const type = readOneOf(dto, 'type', DECISION_VALUES)
  const comment = readString(dto, 'comment')
  switch (type) {
    case 'approve':
      return { type, comment }
    case 'offer':
      return {
        type,
        comment,
        amount: readNumber(dto, 'amount'),
        termInMonths: readNumber(dto, 'termInMonths'),
        rate: readNumber(dto, 'rate'),
      }
    case 'clarify':
      return { type, comment, documents: readStringList(dto.documents, 'requested documents') }
    case 'reject':
      return { type, comment, reason: readString(dto, 'reason') }
  }
}

function mapDecision(value: unknown): RecordedDecision | null {
  if (value === null || value === undefined) return null
  const dto = readRecord(value, 'decision')
  return { ...mapDecisionBody(dto), byEmployeeId: readString(dto, 'byEmployeeId'), at: readDate(dto, 'at') }
}

function mapHistoryEntry(value: unknown): HistoryEntry {
  const dto = readRecord(value, 'history entry')
  return {
    at: readDate(dto, 'at'),
    title: readString(dto, 'title'),
    description: readOptionalString(dto, 'description'),
    tone: readOneOf(dto, 'tone', HISTORY_TONE_VALUES),
  }
}

export function mapStaffApplication(value: unknown): StaffApplication {
  const dto = readRecord(value, 'application')
  return {
    id: readString(dto, 'id'),
    number: readString(dto, 'number'),
    receivedAt: readDate(dto, 'receivedAt'),
    status: readOneOf(dto, 'status', STATUS_VALUES),
    assigneeId: readOptionalString(dto, 'assigneeId'),
    product: mapProduct(dto.product),
    goal: readString(dto, 'goal'),
    amount: readNumber(dto, 'amount'),
    termInMonths: readNumber(dto, 'termInMonths'),
    company: mapCompany(dto.company),
    applicant: mapApplicant(dto.applicant),
    collateral: mapCollateral(dto.collateral),
    scoring: mapScoring(dto.scoring),
    checks: mapList(dto.checks, 'checks', mapCheck),
    recommendation: mapRecommendation(dto.recommendation),
    turnover: mapList(dto.turnover, 'turnover', mapTurnover),
    loans: mapList(dto.loans, 'loans', mapLoan),
    decision: mapDecision(dto.decision),
    history: mapList(dto.history, 'history', mapHistoryEntry),
  }
}

export function mapStaffApplications(value: unknown): StaffApplication[] {
  return mapList(value, 'applications', mapStaffApplication)
}
