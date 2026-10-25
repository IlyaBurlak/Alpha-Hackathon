import { describe, expect, it } from 'vitest'

import { countDigits, findCaretWithDigitsAfter } from './caret'

describe('countDigits', () => {
  it('ignores separators and letters', () => {
    expect(countDigits('2 500 a00')).toBe(6)
    expect(countDigits('')).toBe(0)
  })
})

describe('findCaretWithDigitsAfter', () => {
  it('keeps the caret in front of the same trailing digits when spaces appear', () => {
    // "25|00" is regrouped as "2 500": two digits remain to the right of the caret, so it goes after the "2".
    expect(findCaretWithDigitsAfter('2 500', 2)).toBe(3)
  })

  it('goes to the end when no digits follow, also when the mask added a prefix', () => {
    expect(findCaretWithDigitsAfter('+7 9', 0)).toBe(4)
    expect(findCaretWithDigitsAfter('2 500', 0)).toBe(5)
  })

  it('goes to the start when every digit follows the caret', () => {
    expect(findCaretWithDigitsAfter('2 500', 4)).toBe(0)
    expect(findCaretWithDigitsAfter('2 500', 9)).toBe(0)
  })
})
