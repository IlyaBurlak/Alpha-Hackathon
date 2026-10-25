import { useEffect, useRef } from 'react'

import { onPageReturn } from './page-return'

/** Runs `refresh` each time the user comes back to the tab, so a page that was left open shows fresh data. */
export function useRefreshOnReturn(refresh: () => void): void {
  const latestRefresh = useRef(refresh)

  useEffect(() => {
    latestRefresh.current = refresh
  })

  useEffect(() => onPageReturn(() => latestRefresh.current()), [])
}
