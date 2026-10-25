import { describe, expect, it } from 'vitest'

import { decodeJwtPayload } from './decode-jwt-payload'

function createToken(claims: unknown): string {
  const payload = btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(claims))))
  return `header.${payload.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}.signature`
}

describe('decodeJwtPayload', () => {
  it('reads the claims of a token', () => {
    expect(decodeJwtPayload(createToken({ login: 'alfaOperator1', id: 1, isAdmin: true }))).toEqual({
      login: 'alfaOperator1',
      id: 1,
      isAdmin: true,
    })
  })

  it('reads non-latin claims', () => {
    expect(decodeJwtPayload(createToken({ name: 'Иванова' }))).toEqual({ name: 'Иванова' })
  })

  it.each(['', 'abc', 'a.b', 'a.!!!.c', `a.${btoa('[1]')}.c`])('gives null for the broken token %j', (token) => {
    expect(decodeJwtPayload(token)).toBeNull()
  })
})
