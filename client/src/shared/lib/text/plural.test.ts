import { describe, expect, it } from 'vitest'

import { pluralize } from './plural'

const MONTHS = ['месяц', 'месяца', 'месяцев'] as const

describe('pluralize', () => {
  it.each([
    [1, 'месяц'],
    [2, 'месяца'],
    [4, 'месяца'],
    [5, 'месяцев'],
    [11, 'месяцев'],
    [12, 'месяцев'],
    [21, 'месяц'],
    [24, 'месяца'],
    [60, 'месяцев'],
    [111, 'месяцев'],
  ])('uses the right form for %i', (count, expected) => {
    expect(pluralize(count, MONTHS)).toBe(expected)
  })
})
