import { UnexpectedResponseError } from '@/shared/api'
import { isRecord } from '@/shared/lib'

import { APPLICATION_STATUSES, CREDIT_TIME_UNITS } from '../model/types'
import type {
  Application,
  ApplicationStatus,
  CreditTime,
  CreditTimeUnit,
  ProductChoice,
  ProductOffer,
  ReviewStage,
  Scoring,
  ScoringFactor,
  SelectedProduct,
} from '../model/types'

const REVIEW_STAGES: readonly unknown[] = [0, 1, 2]

function isCreditTimeUnit(value: unknown): value is CreditTimeUnit {
  return Object.values<unknown>(CREDIT_TIME_UNITS).includes(value)
}

function isApplicationStatus(value: unknown): value is ApplicationStatus {
  return Object.values<unknown>(APPLICATION_STATUSES).includes(value)
}

function isReviewStage(value: unknown): value is ReviewStage {
  return REVIEW_STAGES.includes(value)
}

function mapCreditTime(dto: unknown): CreditTime {
  if (!isRecord(dto) || typeof dto.value !== 'number' || !isCreditTimeUnit(dto.units)) {
    throw new UnexpectedResponseError('invalid credit time')
  }
  return { unit: dto.units, value: dto.value }
}

function mapDate(dto: unknown): Date {
  const date = new Date(typeof dto === 'string' ? dto : Number.NaN)
  if (Number.isNaN(date.getTime())) throw new UnexpectedResponseError('invalid date')
  return date
}

function mapOptionalDate(dto: unknown): Date | null {
  return dto === undefined || dto === null ? null : mapDate(dto)
}

function mapOptionalString(dto: unknown): string | null {
  return typeof dto === 'string' ? dto : null
}

function mapScoringFactor(dto: unknown): ScoringFactor {
  if (
    !isRecord(dto) ||
    typeof dto.title !== 'string' ||
    typeof dto.description !== 'string' ||
    typeof dto.points !== 'number'
  ) {
    throw new UnexpectedResponseError('invalid scoring factor')
  }
  return {
    title: dto.title,
    description: dto.description,
    points: dto.points,
    advice: typeof dto.advice === 'string' ? dto.advice : null,
  }
}

/** Scoring is optional: the backend may not send it, but a malformed one is an error. */
function mapScoring(dto: unknown): Scoring | null {
  if (dto === undefined || dto === null) return null
  if (!isRecord(dto) || typeof dto.score !== 'number' || !Array.isArray(dto.factors)) {
    throw new UnexpectedResponseError('invalid scoring')
  }
  return { score: dto.score, factors: dto.factors.map(mapScoringFactor) }
}

function mapReviewStage(dto: unknown): ReviewStage | null {
  if (dto === undefined || dto === null) return null
  if (!isReviewStage(dto)) throw new UnexpectedResponseError('invalid review stage')
  return dto
}

function mapSelectedProduct(dto: unknown): SelectedProduct {
  if (
    !isRecord(dto) ||
    typeof dto.name !== 'string' ||
    typeof dto.persentage !== 'number' ||
    typeof dto.payments !== 'string'
  ) {
    throw new UnexpectedResponseError('invalid selected product')
  }
  return { name: dto.name, interestRate: dto.persentage, payments: dto.payments }
}

function mapProductOffer(dto: unknown): ProductOffer {
  if (
    !isRecord(dto) ||
    typeof dto.id !== 'number' ||
    typeof dto.name !== 'string' ||
    typeof dto.sum !== 'number' ||
    typeof dto.collateral !== 'number' ||
    typeof dto.persentage !== 'number' ||
    typeof dto.payments !== 'string'
  ) {
    throw new UnexpectedResponseError('invalid product offer')
  }
  return {
    id: dto.id,
    name: dto.name,
    sum: dto.sum,
    creditTime: mapCreditTime(dto.creditTime),
    collateral: dto.collateral,
    interestRate: dto.persentage,
    payments: dto.payments,
    description: mapOptionalString(dto.description),
    decisionTime: mapOptionalString(dto.decisionTime),
    scoring: mapScoring(dto.scoring),
  }
}

function mapProductChoice(dto: Record<string, unknown>, status: ApplicationStatus): ProductChoice {
  if (dto.productConditions !== undefined && dto.productConditions !== null) {
    return { kind: 'selected', product: mapSelectedProduct(dto.productConditions) }
  }
  // The backend attaches offers to every application without a recorded product, but only a draft can still choose.
  if (status === APPLICATION_STATUSES.draft && Array.isArray(dto.products)) {
    return { kind: 'offers', items: dto.products.map(mapProductOffer) }
  }
  return { kind: 'not-selected' }
}

export function mapApplication(dto: unknown): Application {
  if (
    !isRecord(dto) ||
    typeof dto.id !== 'number' ||
    typeof dto.organizationId !== 'number' ||
    typeof dto.sum !== 'number' ||
    !isApplicationStatus(dto.status)
  ) {
    throw new UnexpectedResponseError('invalid application')
  }
  return {
    id: dto.id,
    organizationId: dto.organizationId,
    sum: dto.sum,
    status: dto.status,
    createdAt: mapDate(dto.createdAt),
    creditTime: mapCreditTime(dto.creditTime),
    loanIssuanceDate: mapDate(dto.loanIssuanceDate),
    submittedAt: mapOptionalDate(dto.submittedAt),
    signedAt: mapOptionalDate(dto.signedAt),
    issuedAt: mapOptionalDate(dto.issuedAt),
    goal: null,
    productChoice: mapProductChoice(dto, dto.status),
    scoring: mapScoring(dto.scoring),
    reviewStage: mapReviewStage(dto.reviewStage),
  }
}

export function mapApplications(dto: unknown): Application[] {
  if (!Array.isArray(dto)) throw new UnexpectedResponseError('invalid applications list')
  return dto.map(mapApplication)
}
