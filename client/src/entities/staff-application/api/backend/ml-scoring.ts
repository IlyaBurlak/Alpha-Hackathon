/**
 * Reads the result of the ML model from `applicationScore.mlScore` of an application. The backend has to keep there
 * what the ML service answers (docs/ml-contract.md): `pd`, `score`, `risk_class`, `rate_premium_pp`, `model_version`,
 * `updated_at` and `factors[{ title, description, points }]`. Nothing is guessed or filled in: a result that misses
 * a field is reported as unavailable, with the names of the missing fields.
 */
import { isRecord } from '@/shared/lib'

import { RISK_CLASSES, SCORING_STATUSES } from '../../model/types'
import type { RiskClass, ScoringStatus } from '../../model/types'

const MAX_SCORE = 100
const RATE_DECIMALS = 10

type Source = Record<string, unknown>

export interface MlScoringDto {
  score: number
  probabilityOfDefault: number
  riskClass: RiskClass
  /** Annual rate: the rate of the product plus the premium of the model. */
  rate: number
  factors: { title: string; description: string; points: number }[]
  modelVersion: string
  updatedAt: string
}

export interface ReadScoring {
  status: ScoringStatus
  scoring: MlScoringDto | null
  /** Why there is no result; `null` when there is one or the scoring is still running. */
  issue: string | null
}

export const SCORING_PENDING: ReadScoring = { status: SCORING_STATUSES.pending, scoring: null, issue: null }

function isRiskClass(value: unknown): value is RiskClass {
  return RISK_CLASSES.some((candidate) => candidate === value)
}

function isNumberIn(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && value >= min && value <= max
}

function readFactors(value: unknown): MlScoringDto['factors'] | null {
  if (!Array.isArray(value) || value.length === 0) return null
  const factors: MlScoringDto['factors'] = []
  for (const item of value) {
    if (!isRecord(item) || typeof item.title !== 'string' || typeof item.description !== 'string' || typeof item.points !== 'number') {
      return null
    }
    factors.push({ title: item.title, description: item.description, points: item.points })
  }
  return factors
}

function unavailable(issue: string): ReadScoring {
  return { status: SCORING_STATUSES.unavailable, scoring: null, issue }
}

/** `productRate` is the annual rate of the chosen product; the model sends only its premium. */
export function readMlScoring(mlScore: Source | null, productRate: number | null): ReadScoring {
  if (mlScore === null || Object.keys(mlScore).length === 0) return unavailable('Сервер не передал результат модели.')

  const { pd, score, risk_class: riskClass, rate_premium_pp: premium, model_version: modelVersion, updated_at: updatedAt } = mlScore
  const factors = readFactors(mlScore.factors)
  const updatedAtMoment = typeof updatedAt === 'string' ? new Date(updatedAt) : null
  const hasValidDate = updatedAtMoment !== null && !Number.isNaN(updatedAtMoment.getTime())

  const missing = [
    !isNumberIn(pd, 0, 1) && 'pd',
    !isNumberIn(score, 0, MAX_SCORE) && 'score',
    !isRiskClass(riskClass) && 'risk_class',
    typeof premium !== 'number' && 'rate_premium_pp',
    typeof modelVersion !== 'string' && 'model_version',
    !hasValidDate && 'updated_at',
    factors === null && 'factors',
    productRate === null && 'product.persentage',
  ].filter((name): name is string => name !== false)

  if (
    missing.length > 0 ||
    !isNumberIn(pd, 0, 1) ||
    !isNumberIn(score, 0, MAX_SCORE) ||
    !isRiskClass(riskClass) ||
    typeof premium !== 'number' ||
    typeof modelVersion !== 'string' ||
    updatedAtMoment === null ||
    factors === null ||
    productRate === null
  ) {
    return unavailable(`В ответе сервера нет данных модели: ${missing.join(', ')}.`)
  }

  return {
    status: SCORING_STATUSES.ready,
    scoring: {
      score,
      probabilityOfDefault: pd,
      riskClass,
      rate: Math.round((productRate + premium) * RATE_DECIMALS) / RATE_DECIMALS,
      factors,
      modelVersion,
      updatedAt: updatedAtMoment.toISOString(),
    },
    issue: null,
  }
}
