import { ROUTES } from '@/shared/config'
import type { IconName } from '@/shared/ui'

export type StaffNavigationCounter = 'queue' | 'mine' | null

export interface StaffNavigationItem {
  to: string
  icon: IconName
  label: string
  /** Which number from the queue to show next to the item. */
  counter: StaffNavigationCounter
  /** Whether the item is the current one at this address. */
  isCurrent: (pathname: string) => boolean
}

export const STAFF_NAVIGATION: readonly StaffNavigationItem[] = [
  {
    to: ROUTES.staff,
    icon: 'queue',
    label: 'Очередь заявок',
    counter: 'queue',
    // The queue stays highlighted on the page of an application, as in the design.
    isCurrent: (pathname) => pathname === ROUTES.staff || pathname.startsWith(`${ROUTES.staff}/applications/`),
  },
  { to: ROUTES.staffMine, icon: 'person', label: 'Мои заявки', counter: 'mine', isCurrent: (pathname) => pathname === ROUTES.staffMine },
  { to: ROUTES.staffDone, icon: 'done', label: 'Решённые', counter: null, isCurrent: (pathname) => pathname === ROUTES.staffDone },
]
