import type { IconName } from '@/shared/ui'
import { ROUTES } from '@/shared/config'

export interface NavigationItem {
  to: string
  icon: IconName
  label: string
  /** Shorter label for the bottom tab bar. */
  tabLabel: string
  /** Matches only the exact path: the home link must not stay active on every cabinet page. */
  isExact: boolean
  /** Shows the number of approved applications next to the link. */
  hasApprovedCount: boolean
}

export const NAVIGATION_ITEMS: readonly NavigationItem[] = [
  { to: ROUTES.cabinet, icon: 'home', label: 'Главная', tabLabel: 'Главная', isExact: true, hasApprovedCount: false },
  { to: ROUTES.applications, icon: 'applications', label: 'Мои заявки', tabLabel: 'Заявки', isExact: false, hasApprovedCount: true },
  { to: ROUTES.help, icon: 'help', label: 'Помощь', tabLabel: 'Помощь', isExact: false, hasApprovedCount: false },
]
