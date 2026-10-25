import { describe, expect, it } from 'vitest'

import { countDigits, deleteDigitBeside, findCaretWithDigitsAfter, readMaskedEdit } from './caret'

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

describe('deleteDigitBeside', () => {
  it('removes the digit before the caret when Backspace only took a separator', () => {
    // "3 000" with Backspace after the space leaves "3000" and the caret at 1: the "3" goes.
    expect(deleteDigitBeside('3000', 1, 'backward')).toEqual({ text: '000', caret: 0 })
    expect(deleteDigitBeside('+7 9164', 3, 'backward')).toEqual({ text: '+ 9164', caret: 1 })
  })

  it('removes the digit after the caret for Delete', () => {
    expect(deleteDigitBeside('3000', 1, 'forward')).toEqual({ text: '300', caret: 1 })
    expect(deleteDigitBeside('3 000', 1, 'forward')).toEqual({ text: '3 00', caret: 2 })
  })

  it('gives nothing when no digit is on that side', () => {
    expect(deleteDigitBeside('+7', 1, 'backward')).toBeNull()
    expect(deleteDigitBeside('3 ', 2, 'forward')).toBeNull()
  })
})

describe('readMaskedEdit', () => {
  it('keeps the caret in front of the digits that follow it after typing', () => {
    expect(readMaskedEdit({ value: '3 0500 000', caret: 4, previousValue: '3 000 000', inputType: 'insertText' })).toEqual({
      text: '3 0500 000',
      digitsAfterCaret: 5,
    })
  })

  it('turns a deleted separator into the deletion of the digit next to it', () => {
    // "3 |000 000" + Backspace: the browser leaves "3|000 000", the mask would bring the space back.
    expect(readMaskedEdit({ value: '3000 000', caret: 1, previousValue: '3 000 000', inputType: 'deleteContentBackward' })).toEqual({
      text: '000 000',
      digitsAfterCaret: 6,
    })
  })

  it('leaves a real deletion of a digit alone', () => {
    expect(readMaskedEdit({ value: '3 00 000', caret: 4, previousValue: '3 000 000', inputType: 'deleteContentBackward' })).toEqual({
      text: '3 00 000',
      digitsAfterCaret: 3,
    })
  })
})
