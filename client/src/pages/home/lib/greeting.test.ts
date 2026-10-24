import { describe, expect, it } from 'vitest'

import { getGreeting } from './greeting'

describe('getGreeting', () => {
  it.each([
    [0, 'Доброй ночи'],
    [5, 'Доброй ночи'],
    [6, 'Доброе утро'],
    [11, 'Доброе утро'],
    [12, 'Добрый день'],
    [17, 'Добрый день'],
    [18, 'Добрый вечер'],
    [23, 'Добрый вечер'],
  ])('greets at %i:00', (hour, expected) => {
    expect(getGreeting(hour)).toBe(expected)
  })
})
