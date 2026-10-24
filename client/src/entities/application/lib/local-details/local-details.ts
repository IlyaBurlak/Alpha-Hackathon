import { isRecord, jsonStorage } from '@/shared/lib'

import { CREDIT_GOALS } from '../../config/loan-form'
import type { CreditGoalId } from '../../config/loan-form'
import type { SelectedProduct } from '../../model/types'

const KEY_PREFIX = 'application-details:'

/**
 * What the backend does not keep for an application yet, remembered in the browser: the goal, the chosen product,
 * and the user's own actions (sending, withdrawing, signing, discarding a draft). See docs/frontend-mocks.md.
 * Moments are Unix milliseconds.
 */
export interface LocalApplicationDetails {
  goal: CreditGoalId | null
  selectedProduct: SelectedProduct | null
  isSecured: boolean
  submittedAt: number | null
  withdrawnAt: number | null
  signedAt: number | null
  isDiscarded: boolean
}

const EMPTY_DETAILS: LocalApplicationDetails = {
  goal: null,
  selectedProduct: null,
  isSecured: false,
  submittedAt: null,
  withdrawnAt: null,
  signedAt: null,
  isDiscarded: false,
}

function isCreditGoalId(value: unknown): value is CreditGoalId {
  return CREDIT_GOALS.some(({ id }) => id === value)
}

function parseSelectedProduct(value: unknown): SelectedProduct | null {
  if (
    !isRecord(value) ||
    typeof value.name !== 'string' ||
    typeof value.interestRate !== 'number' ||
    typeof value.payments !== 'string'
  ) {
    return null
  }
  return { name: value.name, interestRate: value.interestRate, payments: value.payments }
}

function parseMoment(value: unknown): number | null {
  return typeof value === 'number' ? value : null
}

export function readLocalDetails(applicationId: number): LocalApplicationDetails {
  const stored = jsonStorage.read(`${KEY_PREFIX}${applicationId}`)
  if (!isRecord(stored)) return EMPTY_DETAILS
  return {
    goal: isCreditGoalId(stored.goal) ? stored.goal : null,
    selectedProduct: parseSelectedProduct(stored.selectedProduct),
    isSecured: stored.isSecured === true,
    submittedAt: parseMoment(stored.submittedAt),
    withdrawnAt: parseMoment(stored.withdrawnAt),
    signedAt: parseMoment(stored.signedAt),
    isDiscarded: stored.isDiscarded === true,
  }
}

export function saveLocalDetails(applicationId: number, patch: Partial<LocalApplicationDetails>): void {
  jsonStorage.write(`${KEY_PREFIX}${applicationId}`, { ...readLocalDetails(applicationId), ...patch })
}
