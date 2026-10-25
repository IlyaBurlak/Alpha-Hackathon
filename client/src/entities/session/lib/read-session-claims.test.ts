import { describe, expect, it } from 'vitest'

import { readSessionClaims } from './read-session-claims'

function createToken(claims: unknown): string {
  return `h.${btoa(JSON.stringify(claims)).replace(/=+$/, '')}.s`
}

describe('readSessionClaims', () => {
  it('knows an employee by the isAdmin claim', () => {
    expect(readSessionClaims(createToken({ login: 'alfaOperator1', id: 1, isAdmin: true }))).toEqual({
      login: 'alfaOperator1',
      role: 'employee',
    })
  })

  it('takes everyone else for an entrepreneur', () => {
    expect(readSessionClaims(createToken({ login: 'alfaSergey', id: 5 }))).toEqual({ login: 'alfaSergey', role: 'entrepreneur' })
  })

  it('does not trust a truthy value that is not true', () => {
    expect(readSessionClaims(createToken({ isAdmin: 'yes' })).role).toBe('entrepreneur')
  })

  it('treats an unreadable token as an entrepreneur without a login', () => {
    expect(readSessionClaims('not-a-token')).toEqual({ login: null, role: 'entrepreneur' })
  })
})
