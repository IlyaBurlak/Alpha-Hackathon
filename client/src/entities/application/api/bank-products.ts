import { UnexpectedResponseError, externalHttpClient, readArray, readBoolean, readNumber, readRecord } from '@/shared/api'

import { getTermInMonths } from '../lib/loan/loan-calculation'
import { CREDIT_TIME_UNITS } from '../model/types'
import type { CreditTimeUnit } from '../model/types'

const BANK_PRODUCTS_PATH = '/banks/products'

/** What the bank says about the limits of a product; the rate and the payment terms come with the offers of an application. */
export interface BankProduct {
  id: number
  minSum: number
  maxSum: number
  minTermInMonths: number
  maxTermInMonths: number
  isForLegalEntity: boolean
  isForSoleProprietor: boolean
}

function isCreditTimeUnit(value: unknown): value is CreditTimeUnit {
  return Object.values<unknown>(CREDIT_TIME_UNITS).includes(value)
}

function mapCreditTime(value: unknown, description: string): number {
  const dto = readRecord(value, description)
  if (!isCreditTimeUnit(dto.units)) throw new UnexpectedResponseError(`${description} has an unknown unit`)
  return getTermInMonths({ unit: dto.units, value: readNumber(dto, 'value') })
}

function mapBankProduct(value: unknown): BankProduct {
  const dto = readRecord(value, 'bank product')
  return {
    id: readNumber(dto, 'id'),
    minSum: readNumber(dto, 'minSum'),
    maxSum: readNumber(dto, 'maxSum'),
    minTermInMonths: mapCreditTime(dto.minCreditTime, 'minimum credit time'),
    maxTermInMonths: mapCreditTime(dto.maxCreditTime, 'maximum credit time'),
    isForLegalEntity: readBoolean(dto, 'ooAvailable'),
    isForSoleProprietor: readBoolean(dto, 'ieAvailable'),
  }
}

let catalog: Promise<BankProduct[]> | null = null

/**
 * The catalog of the products of the bank, asked once per visit. The cabinet has no endpoint of its own for it yet
 * (docs/backend-requirements.md), so it is read from the bank system the way the admin panel reads it.
 */
export function getBankProducts(): Promise<BankProduct[]> {
  catalog ??= externalHttpClient
    .get(BANK_PRODUCTS_PATH)
    .then((payload) => readArray(payload, 'bank products').map(mapBankProduct))
    .catch((error: unknown) => {
      catalog = null
      throw error
    })
  return catalog
}
