import { afterEach, describe, expect, it } from 'vitest'

import { readLocalDetails, saveLocalDetails } from './local-details'

class MemoryStorage {
  private readonly values = new Map<string, string>()

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }
}

function useMemoryStorage(): MemoryStorage {
  const storage = new MemoryStorage()
  Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true })
  return storage
}

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'localStorage')
})

describe('local application details', () => {
  it('is empty for an application nobody saved', () => {
    useMemoryStorage()

    expect(readLocalDetails(1)).toMatchObject({ goal: null, selectedProduct: null })
  })

  it('merges patches for the same application and keeps applications apart', () => {
    useMemoryStorage()
    const product = { name: 'Кредит', interestRate: 10, payments: 'ежемесячно' }

    saveLocalDetails(1, { goal: 'equipment' })
    saveLocalDetails(1, { selectedProduct: product })
    saveLocalDetails(2, { goal: 'other' })

    expect(readLocalDetails(1)).toMatchObject({ goal: 'equipment', selectedProduct: product })
    expect(readLocalDetails(2)).toMatchObject({ goal: 'other', selectedProduct: null })
  })

  it('keeps the actions of the user', () => {
    useMemoryStorage()

    saveLocalDetails(5, { submittedAt: 1000, withdrawnAt: 2000, isSecured: true, isDiscarded: true })

    expect(readLocalDetails(5)).toMatchObject({ submittedAt: 1000, withdrawnAt: 2000, signedAt: null, isSecured: true, isDiscarded: true })
  })

  it('ignores a broken record', () => {
    useMemoryStorage().setItem('application-details:3', '{"goal":"flying","selectedProduct":{"name":1}}')

    expect(readLocalDetails(3)).toMatchObject({ goal: null, selectedProduct: null })
  })

  it('works without storage', () => {
    expect(readLocalDetails(4)).toMatchObject({ goal: null, selectedProduct: null })
    expect(() => saveLocalDetails(4, { goal: 'other' })).not.toThrow()
  })
})
