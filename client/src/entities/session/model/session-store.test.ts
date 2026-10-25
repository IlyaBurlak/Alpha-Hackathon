import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { SessionStore } from './session-store'

class MemoryStorage {
  private readonly values = new Map<string, string>()

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }

  removeItem(key: string): void {
    this.values.delete(key)
  }

  clear(): void {
    this.values.clear()
  }
}

function createToken(claims: unknown): string {
  return `h.${btoa(JSON.stringify(claims)).replace(/=+$/, '')}.s`
}

const FUTURE = Math.floor(Date.now() / 1000) + 3600
const PAST = Math.floor(Date.now() / 1000) - 3600

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', { value: new MemoryStorage(), configurable: true })
  Object.defineProperty(globalThis, 'sessionStorage', { value: new MemoryStorage(), configurable: true })
})

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'localStorage')
  Reflect.deleteProperty(globalThis, 'sessionStorage')
})

describe('SessionStore', () => {
  it('resumes the session of the tab with a valid token', () => {
    sessionStorage.setItem('auth-token', createToken({ login: 'alfaSergey', exp: FUTURE }))

    expect(new SessionStore().claims).toEqual({ login: 'alfaSergey', role: 'entrepreneur' })
  })

  it('forgets a token that has expired while nobody was looking', () => {
    sessionStorage.setItem('auth-token', createToken({ login: 'alfaSergey', exp: PAST }))

    const session = new SessionStore()

    expect(session.token).toBeNull()
    expect(sessionStorage.getItem('auth-token')).toBeNull()
  })

  it('resumes a remembered session in a new tab', () => {
    localStorage.setItem('auth-token', createToken({ login: 'alfaSergey', exp: FUTURE }))

    expect(new SessionStore().claims).toEqual({ login: 'alfaSergey', role: 'entrepreneur' })
  })

  it('forgets a remembered token that has expired', () => {
    localStorage.setItem('auth-token', createToken({ login: 'alfaSergey', exp: PAST }))

    expect(new SessionStore().token).toBeNull()
    expect(localStorage.getItem('auth-token')).toBeNull()
  })

  it('signs in for the tab by default and for good when asked to remember', () => {
    const token = createToken({ login: 'alfaSergey', exp: FUTURE })
    const session = new SessionStore()

    session.signIn(token)
    expect(sessionStorage.getItem('auth-token')).toBe(token)
    expect(localStorage.getItem('auth-token')).toBeNull()

    session.signIn(token, { isPersistent: true })
    expect(localStorage.getItem('auth-token')).toBe(token)
    expect(sessionStorage.getItem('auth-token')).toBeNull()
  })

  it('forgets the token and the personal drafts on sign-out', () => {
    const session = new SessionStore()
    session.signIn(createToken({ login: 'alfaSergey', exp: FUTURE }))
    sessionStorage.setItem('application-wizard:3', '{"phone":"+7 916 482-17-35"}')

    session.signOut()

    expect(session.token).toBeNull()
    expect(sessionStorage.getItem('auth-token')).toBeNull()
    expect(sessionStorage.getItem('application-wizard:3')).toBeNull()
  })
})
