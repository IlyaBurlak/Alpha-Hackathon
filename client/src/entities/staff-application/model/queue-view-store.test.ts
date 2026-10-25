import { describe, expect, it } from 'vitest'

import { QueueViewStore } from './queue-view-store'

describe('QueueViewStore: sorting', () => {
  it('starts with the newest first', () => {
    const store = new QueueViewStore()

    expect(store.sortKey).toBe('received')
    expect(store.isDescending).toBe(true)
  })

  it.each([
    ['number', 1, false],
    ['company', 1, false],
    ['status', 1, false],
    ['amount', -1, true],
    ['score', -1, true],
    ['sla', -1, true],
  ] as const)('a click on %s starts with direction %i', (key, direction, isDescending) => {
    const store = new QueueViewStore()

    store.sortBy(key)

    expect(store.direction).toBe(direction)
    expect(store.isDescending).toBe(isDescending)
  })

  it('flips the order on a second click on the same column', () => {
    const store = new QueueViewStore()
    store.sortBy('company')

    store.sortBy('company')

    expect(store.direction).toBe(-1)
    expect(store.isDescending).toBe(true)
  })

  it('"show the most urgent" sorts by the deadline in the work filter', () => {
    const store = new QueueViewStore()
    store.setFilter('ready')

    store.showMostUrgent()

    expect(store).toMatchObject({ filter: 'work', sortKey: 'sla', direction: -1 })
  })
})
