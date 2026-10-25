import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { sessionJsonStorage } from './json-storage'
import { tokenStorage } from './token-storage'

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

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', { value: new MemoryStorage(), configurable: true })
  Object.defineProperty(globalThis, 'sessionStorage', { value: new MemoryStorage(), configurable: true })
})

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'localStorage')
  Reflect.deleteProperty(globalThis, 'sessionStorage')
})

describe('tokenStorage', () => {
  it('keeps the token in the session of the tab and never in the storage that outlives it', () => {
    tokenStorage.set('secret')

    expect(sessionStorage.getItem('auth-token')).toBe('secret')
    expect(localStorage.getItem('auth-token')).toBeNull()
    expect(tokenStorage.get()).toBe('secret')
  })

  it('removes a token an earlier version left in localStorage and does not use it', () => {
    localStorage.setItem('auth-token', 'old-persistent-token')

    expect(tokenStorage.get()).toBeNull()
    expect(localStorage.getItem('auth-token')).toBeNull()
  })

  it('forgets the token', () => {
    tokenStorage.set('secret')

    tokenStorage.clear()

    expect(tokenStorage.get()).toBeNull()
  })

  it('works without any storage', () => {
    Reflect.deleteProperty(globalThis, 'localStorage')
    Reflect.deleteProperty(globalThis, 'sessionStorage')

    expect(() => tokenStorage.set('secret')).not.toThrow()
    expect(tokenStorage.get()).toBeNull()
    expect(() => tokenStorage.clear()).not.toThrow()
  })
})

describe('sessionJsonStorage', () => {
  it('keeps personal drafts in the session only and forgets them all on clear', () => {
    sessionJsonStorage.write('application-wizard:1', { phone: '+7 916 482-17-35' })

    expect(sessionStorage.getItem('application-wizard:1')).not.toBeNull()
    expect(localStorage.getItem('application-wizard:1')).toBeNull()

    sessionJsonStorage.clear()

    expect(sessionJsonStorage.read('application-wizard:1')).toBeNull()
  })
})
