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
  SelectedProduct,
} from '../model/types'

function isCreditTimeUnit(value: unknown): value is CreditTimeUnit {
  return Object.values<unknown>(CREDIT_TIME_UNITS).includes(value)
}

function isApplicationStatus(value: unknown): value is ApplicationStatus {
  return Object.values<unknown>(APPLICATION_STATUSES).includes(value)
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
  }
}

function mapProductChoice(dto: Record<string, unknown>): ProductChoice {
  if (typeof dto.productId === 'number') {
    return { kind: 'selected', product: mapSelectedProduct(dto.product) }
  }
  if (Array.isArray(dto.products)) {
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
    productChoice: mapProductChoice(dto),
  }
}

export function mapApplications(dto: unknown): Application[] {
  if (!Array.isArray(dto)) throw new UnexpectedResponseError('invalid applications list')
  return dto.map(mapApplication)
}
