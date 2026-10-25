import { describe, expect, it } from 'vitest'

import { shortenName } from './queue-text'

describe('shortenName', () => {
  it('shortens a name to the initial and the surname', () => {
    expect(shortenName('Дмитрий Орлов')).toBe('Д.\u00A0Орлов')
    expect(shortenName('Админ')).toBe('Админ')
  })
})
