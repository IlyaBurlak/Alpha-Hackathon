import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { readDraft, removeDraft, writeDraft } from './wizard-draft'
import { createInitialForm } from './wizard-form'

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
}

beforeEach(() => {
  Object.defineProperty(globalThis, 'sessionStorage', { value: new MemoryStorage(), configurable: true })
})

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'sessionStorage')
})

describe('wizard draft', () => {
  it('returns what was written and nothing after it is removed', () => {
    const draft = { step: 2, maxStep: 3, selectedOfferId: 5, form: createInitialForm() } as const

    writeDraft(7, draft)
    expect(readDraft(7)).toEqual(draft)
    expect(readDraft(8)).toBeNull()

    removeDraft(7)
    expect(readDraft(7)).toBeNull()
  })

  it('ignores a draft with a step outside the flow', () => {
    sessionStorage.setItem('application-wizard:7', JSON.stringify({ step: 9, maxStep: 1, selectedOfferId: null, form: createInitialForm() }))

    expect(readDraft(7)).toBeNull()
  })
})
