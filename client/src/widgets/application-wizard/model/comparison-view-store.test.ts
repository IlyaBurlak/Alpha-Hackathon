import { describe, expect, it } from 'vitest'

import { ComparisonViewStore } from './comparison-view-store'

describe('ComparisonViewStore', () => {
  it('starts on the payout structure with a folded schedule', () => {
    const store = new ComparisonViewStore()

    expect(store.tab).toBe('structure')
    expect(store.isScheduleExpanded).toBe(false)
  })

  it('switches the view and unfolds or folds the schedule', () => {
    const store = new ComparisonViewStore()

    store.setTab('balance')
    store.toggleScheduleExpanded()
    expect(store.tab).toBe('balance')
    expect(store.isScheduleExpanded).toBe(true)

    store.toggleScheduleExpanded()
    expect(store.isScheduleExpanded).toBe(false)
  })
})
