import { describe, expect, it, vi } from 'vitest'

import { tokenStorage } from './token-storage'

describe('tokenStorage', () => {
  it('reads the token from localStorage', () => {
    vi.stubGlobal('localStorage', { getItem: vi.fn(() => 'secret-token') })

    expect(tokenStorage.get()).toBe('secret-token')
  })

  it('returns null when localStorage throws', () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => {
        throw new Error('blocked')
      }),
    })

    expect(tokenStorage.get()).toBeNull()
  })

  it('writes the token to localStorage', () => {
    const setItem = vi.fn()
    vi.stubGlobal('localStorage', { setItem })

    tokenStorage.set('new-token')

    expect(setItem).toHaveBeenCalledWith('auth-token', 'new-token')
  })

  it('does not throw when localStorage.setItem throws', () => {
    vi.stubGlobal('localStorage', {
      setItem: vi.fn(() => {
        throw new Error('blocked')
      }),
    })

    expect(() => tokenStorage.set('new-token')).not.toThrow()
  })

  it('removes the token from localStorage', () => {
    const removeItem = vi.fn()
    vi.stubGlobal('localStorage', { removeItem })

    tokenStorage.clear()

    expect(removeItem).toHaveBeenCalledWith('auth-token')
  })

  it('does not throw when localStorage.removeItem throws', () => {
    vi.stubGlobal('localStorage', {
      removeItem: vi.fn(() => {
        throw new Error('blocked')
      }),
    })

    expect(() => tokenStorage.clear()).not.toThrow()
  })
})
