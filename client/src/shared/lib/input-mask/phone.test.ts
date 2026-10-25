import { describe, expect, it } from 'vitest'

import { formatPhone, isCompletePhone } from './phone'

describe('formatPhone', () => {
  it.each([
    ['9', '+7 9'],
    ['916', '+7 916'],
    ['9164', '+7 916 4'],
    ['916482', '+7 916 482'],
    ['9164821', '+7 916 482-1'],
    ['91648217', '+7 916 482-17'],
    ['916482173', '+7 916 482-17-3'],
    ['9164821735', '+7 916 482-17-35'],
  ])('groups %s progressively', (input, expected) => {
    expect(formatPhone(input)).toBe(expected)
  })

  it.each([
    ['+7 916 482-17-35', '+7 916 482-17-35'],
    ['89164821735', '+7 916 482-17-35'],
    ['79164821735', '+7 916 482-17-35'],
    ['+7 (916) 482 17 35', '+7 916 482-17-35'],
    ['+7 916 482-17-35 99', '+7 916 482-17-35'],
  ])('normalizes the pasted number %s', (input, expected) => {
    expect(formatPhone(input)).toBe(expected)
  })

  it('starts the code from a lone 7 or 8, and clears the field when the last digit is removed', () => {
    expect(formatPhone('')).toBe('')
    expect(formatPhone('7')).toBe('+7')
    expect(formatPhone('8')).toBe('+7')
    expect(formatPhone('+7 ')).toBe('')
    expect(formatPhone('+')).toBe('')
  })

  it('ignores letters', () => {
    expect(formatPhone('9a1b6')).toBe('+7 916')
  })
})

describe('isCompletePhone', () => {
  it('needs ten digits after the country code', () => {
    expect(isCompletePhone('+7 916 482-17-35')).toBe(true)
    expect(isCompletePhone('+7 916 482-17-3')).toBe(false)
    expect(isCompletePhone('')).toBe(false)
  })
})
