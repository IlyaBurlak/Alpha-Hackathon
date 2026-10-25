const DEFAULT_MIN_GAP_MS = 5000

/** Where the listener learns that the user came back to the page (the tab became visible or the window got focus). */
export interface PageReturnSource {
  subscribe: (onReturn: () => void) => () => void
}

export const browserPageReturn: PageReturnSource = {
  subscribe: (onReturn) => {
    const handleVisibilityChange = () => {
      if (!document.hidden) onReturn()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', onReturn)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', onReturn)
    }
  },
}

interface PageReturnOptions {
  /** Returns closer than this to the previous refresh are ignored: a tab switch fires several events. */
  minGapMs?: number
  source?: PageReturnSource
  now?: () => number
}

/** Calls `refresh` when the user returns to the page; it replaces polling: nothing is requested on a timer. */
export function onPageReturn(
  refresh: () => void,
  { minGapMs = DEFAULT_MIN_GAP_MS, source = browserPageReturn, now = Date.now }: PageReturnOptions = {},
): () => void {
  let lastRefreshAt = Number.NEGATIVE_INFINITY
  return source.subscribe(() => {
    const moment = now()
    if (moment - lastRefreshAt < minGapMs) return
    lastRefreshAt = moment
    refresh()
  })
}
