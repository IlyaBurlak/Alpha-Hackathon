import { describe, expect, it } from 'vitest'

import type { CheckResult } from '../model/types'
import { recommendDecision } from './recommendation'

const CLEAR: CheckResult = { title: 'ЕГРЮЛ', description: 'Компания действующая', level: 'ok', resultLabel: 'Пройдена' }
const WARNING: CheckResult = { title: 'Платёжеспособность', description: 'Платёж выше нормы', level: 'warning', resultLabel: 'Внимание' }
const FAILED: CheckResult = { title: 'ЕГРЮЛ', description: 'Компания не действует', level: 'fail', resultLabel: 'Не пройдена' }

function createScoring(score: number, factors = [{ title: 'Возраст бизнеса', description: '5 лет', points: 4 }]) {
  return { score, riskClass: 'C' as const, probabilityOfDefault: 0.05, factors }
}

describe('recommendDecision', () => {
  it('advises to approve a high score when every check is clear', () => {
    expect(recommendDecision(createScoring(80), [CLEAR])).toMatchObject({ type: 'approve', offer: null })
  })

  it('advises to refuse a score under the threshold and names the factors that pulled it down', () => {
    const recommendation = recommendDecision(createScoring(30, [{ title: 'Выручка', description: 'мала', points: -9 }]), [CLEAR])

    expect(recommendation?.type).toBe('reject')
    expect(recommendation?.reasons).toEqual(['Балл 30 ниже порога 45', 'Выручка: мала'])
  })

  it('advises to refuse when a check failed, whatever the score is', () => {
    const recommendation = recommendDecision(createScoring(90), [FAILED])

    expect(recommendation?.type).toBe('reject')
    expect(recommendation?.reasons).toEqual(['ЕГРЮЛ: компания не действует'])
  })

  it('gives no advice in the zone of manual decision, and when a high score has a warning', () => {
    expect(recommendDecision(createScoring(60), [CLEAR])).toBeNull()
    expect(recommendDecision(createScoring(85), [CLEAR, WARNING])).toBeNull()
  })
})
