import type { StatusTone } from '@/shared/ui'

import { APPLICATION_STATUSES } from '../../model/types'
import type { ApplicationStatus } from '../../model/types'

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  [APPLICATION_STATUSES.draft]: 'Черновик',
  [APPLICATION_STATUSES.submitted]: 'На рассмотрении',
  [APPLICATION_STATUSES.approved]: 'Одобрена',
  [APPLICATION_STATUSES.rejected]: 'Отказ',
  [APPLICATION_STATUSES.withdrawn]: 'Отозвана',
  [APPLICATION_STATUSES.payout]: 'Выдача',
  [APPLICATION_STATUSES.issued]: 'Кредит выдан',
}

export const APPLICATION_STATUS_TONES: Record<ApplicationStatus, StatusTone> = {
  [APPLICATION_STATUSES.draft]: 'neutral',
  [APPLICATION_STATUSES.submitted]: 'info',
  [APPLICATION_STATUSES.approved]: 'positive',
  [APPLICATION_STATUSES.rejected]: 'negative',
  [APPLICATION_STATUSES.withdrawn]: 'neutral',
  [APPLICATION_STATUSES.payout]: 'positive',
  [APPLICATION_STATUSES.issued]: 'default',
}

const ACTIVE_STATUSES: readonly ApplicationStatus[] = [
  APPLICATION_STATUSES.draft,
  APPLICATION_STATUSES.submitted,
  APPLICATION_STATUSES.approved,
  APPLICATION_STATUSES.payout,
]

/** Applications that still wait for the user or the bank; the rest are shown as finished. */
export function isActiveStatus(status: ApplicationStatus): boolean {
  return ACTIVE_STATUSES.includes(status)
}

export type TimelineStepState = 'done' | 'now' | 'wait' | 'stop' | 'todo'

export const TIMELINE_STEPS = [
  { title: 'Отправлена в банк', description: 'Заявка зарегистрирована' },
  { title: 'На рассмотрении', description: 'Проверяем данные, запрашиваем кредитную историю, оцениваем риск' },
  { title: 'Решение банка', description: 'Одобрение или отказ с объяснением' },
  { title: 'Подписание', description: 'Договор подписывается в кабинете' },
  { title: 'Деньги на счёте', description: 'Перечисляем на расчётный счёт компании' },
] as const

const TIMELINE_STATES: Record<ApplicationStatus, readonly TimelineStepState[]> = {
  [APPLICATION_STATUSES.draft]: ['todo', 'todo', 'todo', 'todo', 'todo'],
  [APPLICATION_STATUSES.submitted]: ['done', 'now', 'todo', 'todo', 'todo'],
  [APPLICATION_STATUSES.approved]: ['done', 'done', 'done', 'wait', 'todo'],
  [APPLICATION_STATUSES.rejected]: ['done', 'done', 'stop', 'todo', 'todo'],
  [APPLICATION_STATUSES.withdrawn]: ['done', 'stop', 'todo', 'todo', 'todo'],
  [APPLICATION_STATUSES.payout]: ['done', 'done', 'done', 'done', 'now'],
  [APPLICATION_STATUSES.issued]: ['done', 'done', 'done', 'done', 'done'],
}

/** Where the application stands on the five-step path from sending to the money on the account. */
export function getTimelineStates(status: ApplicationStatus): readonly TimelineStepState[] {
  return TIMELINE_STATES[status]
}
