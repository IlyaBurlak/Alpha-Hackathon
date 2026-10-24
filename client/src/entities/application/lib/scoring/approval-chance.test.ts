import { describe, expect, it } from 'vitest'

import { getApprovalChance } from './approval-chance'

describe('getApprovalChance', () => {
  it.each([
    [100, 'Высокий', 4, 'positive'],
    [80, 'Высокий', 4, 'positive'],
    [79, 'Хороший', 3, 'positive'],
    [60, 'Хороший', 3, 'positive'],
    [59, 'Средний', 2, 'attention'],
    [45, 'Средний', 2, 'attention'],
    [44, 'Низкий', 1, 'negative'],
    [0, 'Низкий', 1, 'negative'],
  ])('rates score %i as %s', (score, label, level, tone) => {
    expect(getApprovalChance(score)).toEqual({ label, level, tone })
  })
})
