import { describe, expect, it } from 'vitest'

import { estimateScoring, suggestLowerSum } from './mock-scoring'

const NOW = new Date('2026-10-24T12:00:00Z')

describe('estimateScoring', () => {
  it('gives an established company a high score for a modest sum', () => {
    const { score, factors } = estimateScoring({ organizationId: 1, sum: 3_000_000, isSecured: false, now: NOW })

    expect(score).toBe(95)
    expect(factors.map(({ title }) => title)).toEqual([
      'Возраст бизнеса',
      'Сумма к выручке',
      'Долговая нагрузка',
      'Кредитная история',
      'Обороты по счёту',
    ])
  })

  it('lowers the score for a big sum and explains how to fix it', () => {
    const { score, factors } = estimateScoring({ organizationId: 3, sum: 3_000_000, isSecured: false, now: NOW })

    const sumFactor = factors.find(({ title }) => title === 'Сумма к выручке')
    expect(sumFactor?.points).toBe(-10)
    expect(sumFactor?.advice).toMatch(/^Уменьшите сумму до 1\sмлн/)
    expect(score).toBeLessThan(60)
  })

  it('adds a bonus for collateral', () => {
    const plain = estimateScoring({ organizationId: 3, sum: 1_000_000, isSecured: false, now: NOW })
    const secured = estimateScoring({ organizationId: 3, sum: 1_000_000, isSecured: true, now: NOW })

    expect(secured.score - plain.score).toBe(8)
    expect(secured.factors.at(-1)?.title).toBe('Залог')
  })

  it('keeps the score between 0 and 100', () => {
    const { score } = estimateScoring({ organizationId: 6, sum: 500_000_000, isSecured: false, now: NOW })

    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })

  it('penalizes a young company', () => {
    const { factors } = estimateScoring({ organizationId: 4, sum: 1_000_000, isSecured: false, now: NOW })

    expect(factors[0]).toMatchObject({ description: 'Меньше двух лет', points: -10 })
  })

  it('uses defaults for an unknown organization', () => {
    expect(estimateScoring({ organizationId: 999, sum: 1_000_000, isSecured: false, now: NOW }).score).toBeGreaterThan(0)
  })
})

describe('suggestLowerSum', () => {
  it('suggests nothing when the chance is already good', () => {
    expect(suggestLowerSum({ organizationId: 3, sum: 5_000_000, hasSecuredVariant: false, bestScore: 70 })).toBeNull()
  })

  it('suggests a safe sum that raises the score', () => {
    const suggestion = suggestLowerSum({ organizationId: 3, sum: 5_000_000, hasSecuredVariant: false, bestScore: 20 })

    expect(suggestion?.sum).toBe(1_000_000)
    expect(suggestion?.score).toBeGreaterThan(20)
  })

  it('suggests nothing when the sum is already below the safe one', () => {
    expect(suggestLowerSum({ organizationId: 3, sum: 500_000, hasSecuredVariant: false, bestScore: 20 })).toBeNull()
  })
})
