import { describe, expect, it } from 'vitest'

import { buildChecks, buildLoans, buildRecommendation, buildScoring, buildTurnover } from './mock-review'
import type { ReviewInput } from './mock-review'

const NOW = new Date('2026-10-24T12:00:00Z').getTime()

const STRONG_COMPANY: ReviewInput = {
  productId: 'any',
  isSecured: false,
  amount: 3_000_000,
  termInMonths: 24,
  inn: '7714825631',
  registeredAt: new Date('2019-03-14').getTime(),
  annualRevenue: 48_600_000,
  debt: 3_100_000,
  overdueCount: 0,
  hasStableTurnover: true,
  arbitrationCases: 0,
  taxDebt: 0,
  collateralValue: null,
  isRegisterReceived: true,
  isHistoryReceived: true,
  isCompanyActive: true,
  isBankrupt: false,
}

const WEAK_COMPANY: ReviewInput = {
  ...STRONG_COMPANY,
  inn: '7725341987',
  registeredAt: new Date('2022-11-02').getTime(),
  annualRevenue: 22_000_000,
  debt: 6_000_000,
  overdueCount: 2,
  hasStableTurnover: false,
  arbitrationCases: 1,
  amount: 4_000_000,
}

describe('buildScoring', () => {
  it('scores a strong company high with class A', () => {
    const scoring = buildScoring(STRONG_COMPANY, NOW)

    expect(scoring.score).toBe(95)
    expect(scoring.riskClass).toBe('A')
    expect(scoring.rate).toBe(18.9)
    expect(scoring.factors.map((factor) => factor.points)).toEqual([15, 15, 10, 10, 5])
    expect(scoring.probabilityOfDefault).toBeLessThan(0.01)
  })

  it('scores a weak company low and lists arbitration among the factors', () => {
    const scoring = buildScoring(WEAK_COMPANY, NOW)

    expect(scoring.score).toBeLessThan(45)
    expect(scoring.riskClass).toBe('E')
    expect(scoring.factors.map((factor) => factor.title)).toContain('Арбитражные дела')
  })

  it('adds a bonus for collateral', () => {
    const plain = buildScoring(STRONG_COMPANY, NOW).score
    const secured = buildScoring({ ...STRONG_COMPANY, productId: 'line', isSecured: true, collateralValue: 4_800_000 }, NOW).score

    expect(secured - plain).toBe(5)
  })
})

describe('buildChecks and buildRecommendation', () => {
  it('passes every check of a strong company and recommends approval', () => {
    const scoring = buildScoring(STRONG_COMPANY, NOW)
    const checks = buildChecks(STRONG_COMPANY, scoring.rate)

    expect(checks.every((check) => check.level === 'ok')).toBe(true)
    expect(buildRecommendation(STRONG_COMPANY, scoring, checks)).toMatchObject({ type: 'approve', offer: null })
  })

  it('fails the credit history check and recommends refusal for a weak company', () => {
    const scoring = buildScoring(WEAK_COMPANY, NOW)
    const checks = buildChecks(WEAK_COMPANY, scoring.rate)

    expect(checks.find((check) => check.title === 'Бюро кредитных историй')?.level).toBe('fail')
    expect(buildRecommendation(WEAK_COMPANY, scoring, checks).type).toBe('reject')
  })

  it('fails the register check for a company that is not active and recommends refusal', () => {
    const input = { ...STRONG_COMPANY, isCompanyActive: false }
    const checks = buildChecks(input, 18.9)

    expect(checks.find(({ title }) => title === 'ЕГРЮЛ')).toMatchObject({ level: 'fail', resultLabel: 'Не пройдена' })
    expect(buildRecommendation(input, buildScoring(input, NOW), checks).type).toBe('reject')
  })

  it('fails the credit history check for a bankrupt company', () => {
    const checks = buildChecks({ ...STRONG_COMPANY, isBankrupt: true }, 18.9)

    expect(checks.find(({ title }) => title === 'Бюро кредитных историй')).toMatchObject({
      level: 'fail',
      description: 'Компания признана банкротом',
    })
  })

  it('does not divide by zero for a company without revenue', () => {
    const company = { ...STRONG_COMPANY, annualRevenue: 0 }
    const scoring = buildScoring(company, NOW)
    const checks = buildChecks(company, scoring.rate)

    expect(Number.isFinite(scoring.score)).toBe(true)
    expect(scoring.factors).toContainEqual({ title: 'Выручка', description: 'Нет данных за 12 месяцев', points: -25 })
    expect(scoring.factors.some(({ title }) => title === 'Сумма к выручке')).toBe(false)
    expect(checks.find(({ title }) => title === 'Платёжеспособность')).toMatchObject({ level: 'fail' })
    expect(buildRecommendation(company, scoring, checks).type).toBe('reject')
    expect(buildTurnover(company, NOW).every(({ amount }) => amount === 0)).toBe(true)
  })

  it('says there is no data instead of passing the checks of a service that did not answer', () => {
    const checks = buildChecks({ ...STRONG_COMPANY, isRegisterReceived: false, isHistoryReceived: false, annualRevenue: 0 }, null)
    const byTitle = (title: string) => checks.find((check) => check.title === title)

    expect(byTitle('ЕГРЮЛ')).toMatchObject({ level: 'warning', resultLabel: 'Нет данных' })
    expect(byTitle('Бюро кредитных историй')).toMatchObject({ level: 'warning', resultLabel: 'Нет данных' })
    expect(byTitle('Платёжеспособность')).toMatchObject({ level: 'warning', resultLabel: 'Нет данных' })
  })

  it('asks for data when there is tax debt', () => {
    const company = { ...STRONG_COMPANY, taxDebt: 250_000 }
    const scoring = buildScoring(company, NOW)

    expect(buildRecommendation(company, scoring, buildChecks(company, scoring.rate)).type).toBe('clarify')
  })

  it('offers a smaller sum in the manual zone', () => {
    const company = { ...STRONG_COMPANY, annualRevenue: 7_200_000, debt: 450_000, overdueCount: 1 }
    const scoring = buildScoring(company, NOW)
    const recommendation = buildRecommendation(company, scoring, buildChecks(company, scoring.rate))

    expect(recommendation.type).toBe('offer')
    expect(recommendation.offer?.amount).toBeLessThan(company.amount)
    expect(recommendation.offer?.termInMonths).toBe(36)
  })

  it('checks the loan to value of the collateral', () => {
    const company = { ...STRONG_COMPANY, collateralValue: 3_300_000 }
    const collateral = buildChecks(company, 18.9).find((check) => check.title === 'Залог')

    expect(collateral).toMatchObject({ level: 'warning', description: 'LTV 91%, выше 80%' })
  })
})

describe('buildTurnover and buildLoans', () => {
  it('builds twelve months that are the same on every call', () => {
    const first = buildTurnover(STRONG_COMPANY, NOW)

    expect(first).toHaveLength(12)
    expect(buildTurnover(STRONG_COMPANY, NOW)).toEqual(first)
    expect(first.at(-1)?.month).toBe('сен')
  })

  it('shows two sudden drops for an unstable company', () => {
    const monthly = WEAK_COMPANY.annualRevenue / 12
    const drops = buildTurnover(WEAK_COMPANY, NOW).filter((month) => month.amount < monthly * 0.5)

    expect(drops).toHaveLength(2)
  })

  it('splits the debt between our bank and the others', () => {
    const loans = buildLoans(STRONG_COMPANY)

    expect(loans.map((loan) => loan.creditor)).toEqual(['Наш банк', 'Другие банки (БКИ)'])
    expect(loans[0].balance + loans[1].balance).toBeCloseTo(STRONG_COMPANY.debt)
    expect(buildLoans(WEAK_COMPANY)[1].overdue).toBe('2 до 30 дн')
  })
})
