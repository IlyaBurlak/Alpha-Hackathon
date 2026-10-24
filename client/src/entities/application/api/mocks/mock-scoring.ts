/**
 * MOCK: the backend gives the entrepreneur no preliminary scoring (docs/backend-requirements.md, 2.2).
 * The estimate below is the designer's scoring model: a base of 40 points plus factors, from 60 the bank approves.
 * Company figures are invented per organization id of the seeded database.
 */
import { clamp, formatMoneyShort, pluralize } from '@/shared/lib'

import type { Scoring, ScoringFactor } from '../../model/types'

const BASE_SCORE = 40
const MAX_SCORE = 100
const DAYS_IN_YEAR = 365.25
const MS_IN_DAY = 86_400_000
const PERCENT = 100
const SAFE_SUM_SHARE = 0.14
const SUM_ROUNDING = 50_000
const MIN_SUGGESTED_SUM = 100_000
const SECURED_BONUS = 8
const APPROVAL_SCORE = 60

interface CompanyFinancials {
  registrationDate: string
  /** Revenue for 12 months. */
  revenue: number
  /** Debts to other creditors. */
  debt: number
  hasOverdue: boolean
  hasStableTurnover: boolean
}

const FINANCIALS_BY_ORGANIZATION_ID: Record<number, CompanyFinancials> = {
  1: { registrationDate: '2020-01-15', revenue: 48_600_000, debt: 3_100_000, hasOverdue: false, hasStableTurnover: true },
  2: { registrationDate: '2021-01-15', revenue: 32_000_000, debt: 1_000_000, hasOverdue: false, hasStableTurnover: true },
  3: { registrationDate: '2020-01-15', revenue: 7_200_000, debt: 450_000, hasOverdue: true, hasStableTurnover: false },
  4: { registrationDate: '2026-01-15', revenue: 126_000_000, debt: 41_000_000, hasOverdue: false, hasStableTurnover: true },
  5: { registrationDate: '2023-01-15', revenue: 6_000_000, debt: 100_000, hasOverdue: false, hasStableTurnover: true },
  6: { registrationDate: '2025-01-15', revenue: 9_000_000, debt: 2_000_000, hasOverdue: true, hasStableTurnover: false },
}

const DEFAULT_FINANCIALS: CompanyFinancials = {
  registrationDate: '2020-01-01',
  revenue: 10_000_000,
  debt: 500_000,
  hasOverdue: false,
  hasStableTurnover: true,
}

function getFinancials(organizationId: number): CompanyFinancials {
  return FINANCIALS_BY_ORGANIZATION_ID[organizationId] ?? DEFAULT_FINANCIALS
}

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step
}

function formatYears(years: number): string {
  return `${years} ${pluralize(years, ['год', 'года', 'лет'])}`
}

function getAgeFactor(financials: CompanyFinancials, now: Date): ScoringFactor {
  const title = 'Возраст бизнеса'
  const years = (now.getTime() - new Date(financials.registrationDate).getTime()) / (DAYS_IN_YEAR * MS_IN_DAY)
  const wholeYears = Math.floor(years)
  if (years >= 5) return { title, description: `${formatYears(wholeYears)} на рынке`, points: 15, advice: null }
  if (years >= 2) {
    return { title, description: `${formatYears(wholeYears)}, история короткая`, points: 8, advice: null }
  }
  return { title, description: 'Меньше двух лет', points: -10, advice: 'Добавьте залог или уменьшите сумму' }
}

function getSumFactor(financials: CompanyFinancials, sum: number): ScoringFactor {
  const title = 'Сумма к выручке'
  const share = financials.revenue > 0 ? sum / financials.revenue : Number.POSITIVE_INFINITY
  const percent = Number.isFinite(share) ? `${Math.round(share * PERCENT)}% годовой выручки` : 'Выручка не указана'
  if (share < 0.15) return { title, description: percent, points: 15, advice: null }
  if (share < 0.35) return { title, description: percent, points: 5, advice: null }
  return {
    title,
    description: `${percent}, это много`,
    points: share < 0.6 ? -10 : -25,
    advice: `Уменьшите сумму до ${formatMoneyShort(roundTo(financials.revenue * SAFE_SUM_SHARE, SUM_ROUNDING))}`,
  }
}

function getDebtFactor(financials: CompanyFinancials): ScoringFactor {
  const title = 'Долговая нагрузка'
  const share = financials.revenue > 0 ? financials.debt / financials.revenue : Number.POSITIVE_INFINITY
  const description = `Кредиты ${Number.isFinite(share) ? Math.round(share * PERCENT) : PERCENT}% выручки`
  if (share < 0.1) return { title, description, points: 10, advice: null }
  if (share < 0.3) return { title, description, points: 0, advice: null }
  return { title, description: `${description}, выше нормы`, points: -15, advice: 'Погасите часть текущих кредитов' }
}

function getHistoryFactor(financials: CompanyFinancials): ScoringFactor {
  const title = 'Кредитная история'
  if (!financials.hasOverdue) return { title, description: 'Без просрочек', points: 10, advice: null }
  return {
    title,
    description: 'Есть просрочка до 30 дней',
    points: -10,
    advice: 'Закройте просрочку, через 3 месяца оценка вырастет',
  }
}

function getTurnoverFactor(financials: CompanyFinancials): ScoringFactor {
  const title = 'Обороты по счёту'
  if (financials.hasStableTurnover) return { title, description: 'Стабильные поступления', points: 5, advice: null }
  return {
    title,
    description: 'Есть месяцы без поступлений',
    points: -5,
    advice: 'Проводите выручку через расчётный счёт регулярно',
  }
}

interface EstimateInput {
  organizationId: number
  sum: number
  isSecured: boolean
  now?: Date
}

export function estimateScoring({ organizationId, sum, isSecured, now = new Date() }: EstimateInput): Scoring {
  const financials = getFinancials(organizationId)
  const factors = [
    getAgeFactor(financials, now),
    getSumFactor(financials, sum),
    getDebtFactor(financials),
    getHistoryFactor(financials),
    getTurnoverFactor(financials),
  ]
  if (isSecured) {
    factors.push({ title: 'Залог', description: 'Снижает риск для банка', points: SECURED_BONUS, advice: null })
  }
  const score = clamp(BASE_SCORE + factors.reduce((total, { points }) => total + points, 0), 0, MAX_SCORE)
  return { score, factors }
}

interface SuggestInput {
  organizationId: number
  sum: number
  /** Whether a variant with collateral exists among the offers. */
  hasSecuredVariant: boolean
  /** The best score among the current offers. */
  bestScore: number
}

/** A smaller sum that makes approval likely, or `null` when the current sum is fine or a smaller one does not help. */
export function suggestLowerSum({ organizationId, sum, hasSecuredVariant, bestScore }: SuggestInput): { sum: number; score: number } | null {
  if (bestScore >= APPROVAL_SCORE) return null
  const suggested = roundTo(getFinancials(organizationId).revenue * SAFE_SUM_SHARE, SUM_ROUNDING)
  if (suggested < MIN_SUGGESTED_SUM || suggested >= sum) return null
  const plain = estimateScoring({ organizationId, sum: suggested, isSecured: false }).score
  const secured = hasSecuredVariant ? estimateScoring({ organizationId, sum: suggested, isSecured: true }).score : 0
  const score = Math.max(plain, secured)
  return score > bestScore ? { sum: suggested, score } : null
}
