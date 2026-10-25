import { describe, expect, it, vi } from 'vitest'

import { tokenStorage } from './token-storage'

function stubStorages({
  localValue = null,
  sessionValue = null,
}: { localValue?: string | null; sessionValue?: string | null } = {}) {
  const local = { getItem: vi.fn(() => localValue), setItem: vi.fn(), removeItem: vi.fn() }
  const session = { getItem: vi.fn(() => sessionValue), setItem: vi.fn(), removeItem: vi.fn() }
  vi.stubGlobal('localStorage', local)
  vi.stubGlobal('sessionStorage', session)
  return { local, session }
}

describe('tokenStorage.get', () => {
  it('reads the token from localStorage when present', () => {
    stubStorages({ localValue: 'local-token' })

    expect(tokenStorage.get()).toBe('local-token')
  })

  it('falls back to sessionStorage when localStorage has no token', () => {
    stubStorages({ localValue: null, sessionValue: 'session-token' })

    expect(tokenStorage.get()).toBe('session-token')
  })

  it('returns null when neither storage has a token', () => {
    stubStorages()

    expect(tokenStorage.get()).toBeNull()
  })

  it('returns null when a storage throws', () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => {
        throw new Error('blocked')
      }),
    })
    vi.stubGlobal('sessionStorage', { getItem: vi.fn(() => null) })

    expect(tokenStorage.get()).toBeNull()
  })
})

describe('tokenStorage.set', () => {
  it('clears both storages and writes to localStorage by default', () => {
    const { local, session } = stubStorages()

    tokenStorage.set('new-token')

    expect(local.removeItem).toHaveBeenCalledWith('auth-token')
    expect(session.removeItem).toHaveBeenCalledWith('auth-token')
    expect(local.setItem).toHaveBeenCalledWith('auth-token', 'new-token')
    expect(session.setItem).not.toHaveBeenCalled()
  })

  it('writes to sessionStorage when isPersistent is false', () => {
    const { local, session } = stubStorages()

    tokenStorage.set('new-token', { isPersistent: false })

    expect(session.setItem).toHaveBeenCalledWith('auth-token', 'new-token')
    expect(local.setItem).not.toHaveBeenCalled()
  })

  it('does not throw when the target storage throws on write', () => {
    stubStorages()
    vi.stubGlobal('localStorage', {
      removeItem: vi.fn(),
      setItem: vi.fn(() => {
        throw new Error('blocked')
      }),
    })

    expect(() => tokenStorage.set('new-token')).not.toThrow()
  })
})

describe('tokenStorage.clear', () => {
  it('removes the token from both storages', () => {
    const { local, session } = stubStorages()

    tokenStorage.clear()

    expect(local.removeItem).toHaveBeenCalledWith('auth-token')
    expect(session.removeItem).toHaveBeenCalledWith('auth-token')
  })
})
