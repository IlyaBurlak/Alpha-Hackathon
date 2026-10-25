import { describe, expect, it } from 'vitest'

import { SCORING_PENDING, readMlScoring } from './ml-scoring'

/** The answer of the ML service as the server logs it (docs/ml-contract.md). */
const ML_RESULT = {
  pd: 0.054625119165717294,
  score: 64,
  risk_class: 'C',
  rate_premium_pp: 1,
  model_version: 'logreg-0.1',
  updated_at: '2026-10-25T14:55:46.000922Z',
  mode: 'full',
  factors: [
    { feature: 'bank_client_months', title: 'Стаж клиента банка', description: 'Вы клиент банка 45 мес. (типичное значение 8).', points: 2 },
    {
      feature: 'avg_revenue_monthly',
      title: 'Среднемесячная выручка',
      description: 'Выручка около 33333 ₽ в месяц.',
      points: -5,
      advice: 'Запросите сумму поменьше.',
    },
  ],
}

/** What the backend keeps today instead of the answer. */
const STUB = { model_version: 'stub-0.0', factors: ['revenue_cv', 'profit_cv'] }

describe('readMlScoring', () => {
  it('reads the real answer of the model and adds the premium to the rate of the product', () => {
    expect(readMlScoring(ML_RESULT, 15)).toEqual({
      status: 'ready',
      issue: null,
      scoring: {
        score: 64,
        probabilityOfDefault: 0.054625119165717294,
        riskClass: 'C',
        rate: 16,
        modelVersion: 'logreg-0.1',
        updatedAt: '2026-10-25T14:55:46.000Z',
        factors: [
          { title: 'Стаж клиента банка', description: 'Вы клиент банка 45 мес. (типичное значение 8).', points: 2 },
          { title: 'Среднемесячная выручка', description: 'Выручка около 33333 ₽ в месяц.', points: -5 },
        ],
      },
    })
  })

  it('keeps the rate of the product and the premium exact to a tenth', () => {
    expect(readMlScoring({ ...ML_RESULT, rate_premium_pp: 0.3 }, 10)).toMatchObject({ scoring: { rate: 10.3 } })
  })

  it('says the result is unavailable when the backend sent nothing', () => {
    expect(readMlScoring(null, 15)).toMatchObject({ status: 'unavailable', scoring: null, issue: 'Сервер не передал результат модели.' })
    expect(readMlScoring({}, 15)).toMatchObject({ status: 'unavailable', scoring: null })
  })

  it('does not take the stub of the backend for a result and names the fields that are missing', () => {
    const reading = readMlScoring(STUB, 15)

    expect(reading).toMatchObject({ status: 'unavailable', scoring: null })
    expect(reading.issue).toBe('В ответе сервера нет данных модели: pd, score, risk_class, rate_premium_pp, updated_at, factors.')
  })

  it.each([
    ['pd', { pd: 1.5 }],
    ['score', { score: 101 }],
    ['risk_class', { risk_class: 'Z' }],
    ['rate_premium_pp', { rate_premium_pp: '1' }],
    ['updated_at', { updated_at: 'yesterday' }],
    ['factors', { factors: [] }],
  ])('rejects a result with a broken %s', (field, override) => {
    const reading = readMlScoring({ ...ML_RESULT, ...override }, 15)

    expect(reading).toMatchObject({ status: 'unavailable', scoring: null })
    expect(reading.issue).toContain(field)
  })

  it('has no result without the rate of the product, because the final rate cannot be known', () => {
    expect(readMlScoring(ML_RESULT, null)).toMatchObject({ status: 'unavailable', issue: expect.stringContaining('product.persentage') })
  })

  it('has a pending state for a scoring that is running', () => {
    expect(SCORING_PENDING).toEqual({ status: 'pending', scoring: null, issue: null })
  })
})
