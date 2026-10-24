import { describe, expect, it } from 'vitest'

import { CREDIT_TIME_UNITS } from '../../model/types'
import { formatCreditTime } from './format'

describe('formatCreditTime', () => {
  it('converts any unit to months', () => {
    expect(formatCreditTime({ value: 2, unit: CREDIT_TIME_UNITS.year })).toMatch(/^24\sмесяца$/)
    expect(formatCreditTime({ value: 6, unit: CREDIT_TIME_UNITS.month })).toMatch(/^6\sмесяцев$/)
  })
})
