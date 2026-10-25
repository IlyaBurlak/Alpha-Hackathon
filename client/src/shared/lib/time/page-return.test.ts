import { describe, expect, it, vi } from 'vitest'

import { onPageReturn } from './page-return'
import type { PageReturnSource } from './page-return'

function createSource() {
  let listener: () => void = () => undefined
  const unsubscribe = vi.fn()
  const source: PageReturnSource = {
    subscribe: (onReturn) => {
      listener = onReturn
      return unsubscribe
    },
  }
  return { source, unsubscribe, comeBack: () => listener() }
}

describe('onPageReturn', () => {
  it('refreshes when the user comes back', () => {
    const { source, comeBack } = createSource()
    const refresh = vi.fn()
    onPageReturn(refresh, { source })

    comeBack()

    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('ignores the events that follow one another within the minimum gap', () => {
    const { source, comeBack } = createSource()
    const refresh = vi.fn()
    let moment = 0
    onPageReturn(refresh, { source, minGapMs: 5000, now: () => moment })

    comeBack()
    moment = 100
    comeBack()
    expect(refresh).toHaveBeenCalledTimes(1)

    moment = 6000
    comeBack()
    expect(refresh).toHaveBeenCalledTimes(2)
  })

  it('stops listening when unsubscribed', () => {
    const { source, unsubscribe } = createSource()

    onPageReturn(vi.fn(), { source })()

    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })
})
