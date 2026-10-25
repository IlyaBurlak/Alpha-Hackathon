import { describe, expect, it } from 'vitest'

import { isTokenExpired } from './token-expiry'

function createToken(claims: unknown): string {
  return `h.${btoa(JSON.stringify(claims)).replace(/=+$/, '')}.s`
}

const NOW = Date.UTC(2026, 9, 25, 12, 0, 0)
const SECONDS = (moment: number) => Math.floor(moment / 1000)

describe('isTokenExpired', () => {
  it('knows a token whose time has passed', () => {
    expect(isTokenExpired(createToken({ exp: SECONDS(NOW) - 1 }), NOW)).toBe(true)
    expect(isTokenExpired(createToken({ exp: SECONDS(NOW) }), NOW)).toBe(true)
  })

  it('keeps a token that is still valid', () => {
    expect(isTokenExpired(createToken({ exp: SECONDS(NOW) + 60 }), NOW)).toBe(false)
  })

  it('does not judge a token without the claim or an unreadable one', () => {
    expect(isTokenExpired(createToken({ login: 'x' }), NOW)).toBe(false)
    expect(isTokenExpired('not-a-token', NOW)).toBe(false)
    expect(isTokenExpired(createToken({ exp: 'soon' }), NOW)).toBe(false)
  })
})
