/**
 * MOCK: the backend gives employees no scoring, checks, recommendation, turnover or loans of an application
 * (docs/backend-requirements.md, staff cabinet). Everything below is calculated from the company figures with the
 * model of the design: a base score of 40 plus factors, thresholds 45 and 75. Replace with the backend data.
 */
import { calculateAnnuityPayment, clamp, formatMoney, formatPercent, pluralize } from '@/shared/lib'

import {
  AMOUNT_TO_REVENUE_LIMIT,
  AUTO_APPROVAL_SCORE_FROM,
  BASE_SCORE,
  DEBT_TO_REVENUE_LIMIT,
  LOAN_TO_COLLATERAL_LIMIT,
  PAYMENT_TO_MONTHLY_REVENUE_LIMIT,
  REFUSAL_SCORE_BELOW,
} from '../../config/review-rules'
import { CHECK_LEVELS, DECISION_TYPES } from '../../model/types'
import type { CheckLevel, DecisionType, RiskClass } from '../../model/types'

const DAYS_IN_YEAR = 365.25
const MS_IN_DAY = 86_400_000
const PERCENT = 100
const MONTHS_IN_YEAR = 12
const OUR_BANK_DEBT_SHARE = 0.35
const OUR_LOAN_TERM_IN_MONTHS = 18
const OTHER_LOANS_TERM_IN_MONTHS = 24
const MODEL_AGE_IN_DAYS = 12
const MONTH_NAMES = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'] as const
const BASE_RATES: Record<string, number> = { any: 19.9, gov: 12.5, line: 16.9, auto: 15.9 }
const MANUAL_REVIEW_SCORE_FROM = 60
const GOOD_CLASS_FROM = 80
const STRONG_CLASS_FROM = 70
const SATISFACTORY_CLASS_FROM = 60
const MEDIUM_RATE_ADJUSTMENT_SCORE = 45

export interface ReviewInput {
  productId: string
  isSecured: boolean
  amount: number
  termInMonths: number
  inn: string
  registeredAt: number
  annualRevenue: number
  debt: number
  overdueCount: number
  hasStableTurnover: boolean
  arbitrationCases: number
  taxDebt: number
  collateralValue: number | null
  /** From the register; the demo applications are all active. */
  isCompanyActive: boolean
  /** From the credit bureau; the demo applications have none. */
  isBankrupt: boolean
}

interface Factor {
  title: string
  description: string
  points: number
}

function formatYears(years: number): string {
  return `${years} ${pluralize(years, ['год', 'года', 'лет'])}`
}

function formatDelays(count: number): string {
  return `${count} ${pluralize(count, ['просрочка', 'просрочки', 'просрочек'])}`
}

/** The sum and the debt against the yearly revenue; without revenue no share can be counted, one factor says so. */
function buildRevenueFactors(input: ReviewInput): Factor[] {
  if (input.annualRevenue <= 0) return [{ title: 'Выручка', description: 'Нет данных за 12 месяцев', points: -25 }]

  const amountShare = input.amount / input.annualRevenue
  const debtShare = input.debt / input.annualRevenue
  const amountPercent = `${Math.round(amountShare * PERCENT)}%`
  const debtPercent = `${Math.round(debtShare * PERCENT)}%`
  const factors: Factor[] = []

  if (amountShare < 0.15) factors.push({ title: 'Сумма к выручке', description: `${amountPercent} годовой выручки`, points: 15 })
  else if (amountShare < AMOUNT_TO_REVENUE_LIMIT) factors.push({ title: 'Сумма к выручке', description: amountPercent, points: 5 })
  else {
    factors.push({
      title: 'Сумма к выручке',
      description: `${amountPercent}, выше порога ${AMOUNT_TO_REVENUE_LIMIT * PERCENT}%`,
      points: amountShare < 0.6 ? -10 : -25,
    })
  }

  if (debtShare < 0.1) factors.push({ title: 'Долговая нагрузка', description: `${debtPercent} выручки`, points: 10 })
  else if (debtShare < DEBT_TO_REVENUE_LIMIT) factors.push({ title: 'Долговая нагрузка', description: `${debtPercent} выручки`, points: 0 })
  else {
    factors.push({
      title: 'Долговая нагрузка',
      description: `${debtPercent}, выше порога ${DEBT_TO_REVENUE_LIMIT * PERCENT}%`,
      points: -15,
    })
  }
  return factors
}

function buildFactors(input: ReviewInput, now: number): Factor[] {
  const years = (now - input.registeredAt) / (DAYS_IN_YEAR * MS_IN_DAY)
  const wholeYears = Math.floor(years)
  const factors: Factor[] = []

  if (years >= 5) factors.push({ title: 'Возраст бизнеса', description: formatYears(wholeYears), points: 15 })
  else if (years >= 2) factors.push({ title: 'Возраст бизнеса', description: formatYears(wholeYears), points: 8 })
  else factors.push({ title: 'Возраст бизнеса', description: 'Меньше 2 лет', points: -10 })

  factors.push(...buildRevenueFactors(input))

  if (input.overdueCount === 0) factors.push({ title: 'Кредитная история', description: 'Без просрочек', points: 10 })
  else {
    factors.push({
      title: 'Кредитная история',
      description: `${formatDelays(input.overdueCount)} за 12 месяцев`,
      points: input.overdueCount > 1 ? -18 : -10,
    })
  }

  factors.push(
    input.hasStableTurnover
      ? { title: 'Обороты по счёту', description: 'Стабильные', points: 5 }
      : { title: 'Обороты по счёту', description: 'Нестабильные', points: -5 },
  )

  if (input.arbitrationCases > 0) {
    factors.push({
      title: 'Арбитражные дела',
      description: `${input.arbitrationCases} в роли ответчика`,
      points: input.arbitrationCases > 2 ? -8 : -3,
    })
  }
  if (input.isSecured) factors.push({ title: 'Залог', description: 'Покрывает сумму кредита', points: 8 })
  return factors
}

function getRiskClass(score: number): RiskClass {
  if (score >= GOOD_CLASS_FROM) return 'A'
  if (score >= STRONG_CLASS_FROM) return 'B'
  if (score >= SATISFACTORY_CLASS_FROM) return 'C'
  if (score >= REFUSAL_SCORE_BELOW) return 'D'
  return 'E'
}

function getRateAdjustment(score: number): number {
  if (score >= GOOD_CLASS_FROM) return -1
  if (score >= MANUAL_REVIEW_SCORE_FROM) return 1
  if (score >= MEDIUM_RATE_ADJUSTMENT_SCORE) return 3.5
  return 6
}

export function buildScoring(input: ReviewInput, now: number) {
  const factors = buildFactors(input, now)
  const score = clamp(BASE_SCORE + factors.reduce((total, factor) => total + factor.points, 0), 0, 100)
  const rate = (BASE_RATES[input.productId] ?? BASE_RATES.any) + getRateAdjustment(score)
  return {
    score,
    probabilityOfDefault: 0.45 / (1 + Math.exp((score - 48) / 8)),
    riskClass: getRiskClass(score),
    rate: Number(rate.toFixed(1)),
    factors,
    modelVersion: 'SME-PD v2.3',
    updatedAt: new Date(now - MODEL_AGE_IN_DAYS * MS_IN_DAY).toISOString(),
  }
}

interface Check {
  title: string
  description: string
  level: CheckLevel
  resultLabel: string
}

const PASSED = 'Пройдена'
const ATTENTION = 'Внимание'
const FAILED = 'Не пройдена'

export function buildChecks(input: ReviewInput, rate: number): Check[] {
  const { ok, warning, fail } = CHECK_LEVELS
  const checks: Check[] = [
    input.isCompanyActive
      ? { title: 'ЕГРЮЛ', description: 'Компания действующая, сведения о руководителе совпадают', level: ok, resultLabel: PASSED }
      : { title: 'ЕГРЮЛ', description: 'Компания не действует по данным реестра', level: fail, resultLabel: FAILED },
    { title: 'ФНС «Прозрачный бизнес»', description: 'Нет массового адреса и массового руководителя', level: ok, resultLabel: PASSED },
    input.taxDebt
      ? { title: 'Налоговая задолженность', description: `Задолженность ${formatMoney(input.taxDebt)}`, level: warning, resultLabel: ATTENTION }
      : { title: 'Налоговая задолженность', description: 'Задолженности нет', level: ok, resultLabel: PASSED },
    input.isBankrupt
      ? { title: 'Бюро кредитных историй', description: 'Компания признана банкротом', level: fail, resultLabel: FAILED }
      : input.overdueCount === 0
        ? { title: 'Бюро кредитных историй', description: 'Просрочек нет, все кредиты обслуживаются', level: ok, resultLabel: PASSED }
        : {
          title: 'Бюро кредитных историй',
          description: `${formatDelays(input.overdueCount)} до 30 дней за год`,
          level: input.overdueCount > 1 ? fail : warning,
          resultLabel: input.overdueCount > 1 ? FAILED : ATTENTION,
        },
    input.arbitrationCases === 0
      ? { title: 'Арбитражные дела', description: 'Дел в роли ответчика нет', level: ok, resultLabel: PASSED }
      : {
          title: 'Арбитражные дела',
          description: `${input.arbitrationCases} ${pluralize(input.arbitrationCases, ['дело', 'дела', 'дел'])} в роли ответчика`,
          level: warning,
          resultLabel: ATTENTION,
        },
    { title: 'Санкционные списки и ПОД/ФТ', description: 'Совпадений не найдено', level: ok, resultLabel: PASSED },
  ]

  if (input.collateralValue !== null) {
    const loanToValue = input.amount / input.collateralValue
    const percent = Math.round(loanToValue * PERCENT)
    checks.push(
      loanToValue <= LOAN_TO_COLLATERAL_LIMIT
        ? { title: 'Залог', description: `LTV ${percent}%`, level: ok, resultLabel: PASSED }
        : { title: 'Залог', description: `LTV ${percent}%, выше ${LOAN_TO_COLLATERAL_LIMIT * PERCENT}%`, level: warning, resultLabel: ATTENTION },
    )
  }

  if (input.annualRevenue <= 0) {
    checks.push({ title: 'Платёжеспособность', description: 'Нет данных о выручке, платёж оценить нельзя', level: fail, resultLabel: FAILED })
    return checks
  }

  const payment = calculateAnnuityPayment(input.amount, rate, input.termInMonths)
  const paymentShare = payment / (input.annualRevenue / MONTHS_IN_YEAR)
  const paymentPercent = Math.round(paymentShare * PERCENT)
  checks.push(
    paymentShare < PAYMENT_TO_MONTHLY_REVENUE_LIMIT
      ? { title: 'Платёжеспособность', description: `Новый платёж ${paymentPercent}% месячной выручки`, level: ok, resultLabel: PASSED }
      : {
          title: 'Платёжеспособность',
          description: `Новый платёж ${paymentPercent}% месячной выручки, выше ${PAYMENT_TO_MONTHLY_REVENUE_LIMIT * PERCENT}%`,
          level: warning,
          resultLabel: ATTENTION,
        },
  )
  return checks
}

const OFFER_SHARE_GOOD = 0.75
const OFFER_SHARE_WEAK = 0.55
const OFFER_AMOUNT_STEP = 100_000
const OFFER_EXTRA_TERM_IN_MONTHS = 12
const MAX_TERM_IN_MONTHS = 60

export function buildRecommendation(
  input: ReviewInput,
  scoring: { score: number; riskClass: RiskClass; probabilityOfDefault: number },
  checks: readonly Check[],
) {
  const failed = checks.filter((check) => check.level === CHECK_LEVELS.fail)
  const warned = checks.filter((check) => check.level === CHECK_LEVELS.warning)
  const describe = (check: Check) => `${check.title}: ${check.description.toLowerCase()}`
  const result = (type: DecisionType, reasons: string[], offer: { amount: number; termInMonths: number } | null = null) => ({
    type,
    reasons,
    offer,
  })

  if (failed.length > 0 || scoring.score < REFUSAL_SCORE_BELOW) {
    const reasons = failed.map(describe)
    if (scoring.score < REFUSAL_SCORE_BELOW) reasons.push(`Балл ${scoring.score} ниже порога ${REFUSAL_SCORE_BELOW}`)
    return result(DECISION_TYPES.reject, reasons)
  }
  if (warned.some((check) => ['Арбитражные дела', 'Налоговая задолженность'].includes(check.title))) {
    return result(DECISION_TYPES.clarify, warned.map(describe))
  }
  if (scoring.score >= AUTO_APPROVAL_SCORE_FROM && warned.length === 0) {
    return result(DECISION_TYPES.approve, [
      `Балл ${scoring.score}, класс ${scoring.riskClass}`,
      'Все проверки пройдены',
      `Вероятность дефолта ${formatPercent(scoring.probabilityOfDefault * PERCENT)}`,
    ])
  }
  const share = scoring.score >= MANUAL_REVIEW_SCORE_FROM ? OFFER_SHARE_GOOD : OFFER_SHARE_WEAK
  return result(DECISION_TYPES.offer, [`Балл ${scoring.score} в зоне ручного решения`, ...warned.map(describe)], {
    amount: Math.round((input.amount * share) / OFFER_AMOUNT_STEP) * OFFER_AMOUNT_STEP,
    termInMonths: Math.min(input.termInMonths + OFFER_EXTRA_TERM_IN_MONTHS, MAX_TERM_IN_MONTHS),
  })
}

const RANDOM_MULTIPLIER = 16_807
const RANDOM_MODULUS = 2_147_483_647
const SEASON_AMPLITUDE = 0.12
const DROP_MONTHS_AGO = [3, 7]
const DROP_FACTOR = 0.25

/** A repeatable pseudo-random sequence: the same company always gets the same turnover. */
function createRandom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * RANDOM_MULTIPLIER) % RANDOM_MODULUS
    return state / RANDOM_MODULUS
  }
}

export function buildTurnover(input: ReviewInput, now: number) {
  const random = createRandom(Number(input.inn.slice(-6)) || 7)
  const monthlyBase = input.annualRevenue / MONTHS_IN_YEAR
  const today = new Date(now)
  return Array.from({ length: MONTHS_IN_YEAR }, (_, index) => {
    const monthsAgo = MONTHS_IN_YEAR - 1 - index
    const month = new Date(today.getFullYear(), today.getMonth() - monthsAgo - 1, 1)
    const season = 1 + SEASON_AMPLITUDE * Math.sin(((month.getMonth() + 2) / MONTHS_IN_YEAR) * Math.PI * 2)
    let amount = monthlyBase * season * (0.9 + random() * 0.2)
    if (!input.hasStableTurnover && DROP_MONTHS_AGO.includes(monthsAgo)) amount *= DROP_FACTOR
    return { month: MONTH_NAMES[month.getMonth()], amount }
  })
}

export function buildLoans(input: ReviewInput) {
  const ours = input.debt * OUR_BANK_DEBT_SHARE
  const others = input.debt - ours
  const loans = [{ creditor: 'Наш банк', balance: ours, monthlyPayment: ours / OUR_LOAN_TERM_IN_MONTHS, overdue: null as string | null }]
  if (others > 0) {
    loans.push({
      creditor: 'Другие банки (БКИ)',
      balance: others,
      monthlyPayment: others / OTHER_LOANS_TERM_IN_MONTHS,
      overdue: input.overdueCount ? `${input.overdueCount} до 30 дн` : null,
    })
  }
  return loans
}
