import { describe, expect, it } from 'vitest'

import { UnexpectedResponseError } from './errors'
import { readBoolean, readDate, readNumber, readOneOf, readOptionalDate, readOptionalNumber, readOptionalString, readRecord, readString } from './response-reader'

const SOURCE = { name: 'a', count: 2, isOn: true, at: '2026-10-24T10:00:00.000Z', kind: 'x', nothing: null }

describe('response readers', () => {
  it('read values of the expected type', () => {
    expect(readString(SOURCE, 'name')).toBe('a')
    expect(readNumber(SOURCE, 'count')).toBe(2)
    expect(readBoolean(SOURCE, 'isOn')).toBe(true)
    expect(readDate(SOURCE, 'at')).toEqual(new Date('2026-10-24T10:00:00.000Z'))
    expect(readOneOf(SOURCE, 'kind', ['x', 'y'])).toBe('x')
    expect(readOptionalString(SOURCE, 'nothing')).toBeNull()
    expect(readOptionalString(SOURCE, 'missing')).toBeNull()
  })

  it.each([
    () => readString(SOURCE, 'count'),
    () => readNumber(SOURCE, 'name'),
    () => readBoolean(SOURCE, 'name'),
    () => readDate({ at: 'yesterday' }, 'at'),
    () => readOneOf(SOURCE, 'kind', ['y']),
    () => readRecord([], 'payload'),
    () => readOptionalString(SOURCE, 'count'),
  ])('fail with UnexpectedResponseError on a mismatch', (read) => {
    expect(read).toThrow(UnexpectedResponseError)
  })
})

describe('optional readers', () => {
  it('give null for an absent or null value', () => {
    expect(readOptionalNumber({}, 'x')).toBeNull()
    expect(readOptionalNumber({ x: null }, 'x')).toBeNull()
    expect(readOptionalDate({}, 'x')).toBeNull()
    expect(readOptionalDate({ x: null }, 'x')).toBeNull()
  })

  it('read a present value, zero included, and still reject a wrong one', () => {
    expect(readOptionalNumber({ x: 0 }, 'x')).toBe(0)
    expect(readOptionalDate({ x: '2026-10-25T10:00:00Z' }, 'x')).toEqual(new Date('2026-10-25T10:00:00Z'))
    expect(() => readOptionalNumber({ x: 'abc' }, 'x')).toThrow(UnexpectedResponseError)
    expect(() => readOptionalDate({ x: 'yesterday' }, 'x')).toThrow(UnexpectedResponseError)
  })
})
