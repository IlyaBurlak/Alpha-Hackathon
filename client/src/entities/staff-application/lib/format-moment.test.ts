import { describe, expect, it } from 'vitest'

import { formatMoment } from './format-moment'

const NOW = new Date(2026, 9, 24, 15, 0)

describe('formatMoment', () => {
  it('names today and yesterday', () => {
    expect(formatMoment(new Date(2026, 9, 24, 9, 5), NOW)).toBe('сегодня, 09:05')
    expect(formatMoment(new Date(2026, 9, 23, 18, 30), NOW)).toBe('вчера, 18:30')
  })

  it('gives the date for older moments', () => {
    expect(formatMoment(new Date(2026, 4, 12, 10, 20), NOW)).toBe('12 мая 2026, 10:20')
  })
})
