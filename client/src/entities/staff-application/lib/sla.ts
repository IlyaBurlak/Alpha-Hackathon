import { clamp } from '@/shared/lib'

import { SLA_CRITICAL_HOURS, SLA_HOURS, SLA_WARNING_HOURS } from '../config/review-rules'
import { STAFF_STATUSES } from '../model/types'
import type { StaffApplication } from '../model/types'

const MS_IN_HOUR = 3_600_000
const MS_IN_MINUTE = 60_000

export type SlaTone = 'positive' | 'attention' | 'negative' | 'neutral'

export interface Sla {
  label: string
  tone: SlaTone
  /** How much of the time is gone, 0..1. */
  progress: number
  isOverdue: boolean
}

const OVERDUE_LABEL = 'Просрочено'
const WAITING_FOR_CLIENT_LABEL = 'Ждём клиента'

/** Time left to answer the application; `null` once the bank has given its final or counter answer. */
export function getSla(application: Pick<StaffApplication, 'status' | 'receivedAt'>, now: number): Sla | null {
  const { status, receivedAt } = application
  if (status === STAFF_STATUSES.approved || status === STAFF_STATUSES.rejected || status === STAFF_STATUSES.offer) return null
  if (status === STAFF_STATUSES.clarify) return { label: WAITING_FOR_CLIENT_LABEL, tone: 'neutral', progress: 0, isOverdue: false }

  const left = SLA_HOURS * MS_IN_HOUR - (now - receivedAt.getTime())
  const progress = clamp(1 - left / (SLA_HOURS * MS_IN_HOUR), 0, 1)
  if (left <= 0) return { label: OVERDUE_LABEL, tone: 'negative', progress: 1, isOverdue: true }

  const hours = Math.floor(left / MS_IN_HOUR)
  const minutes = Math.floor((left % MS_IN_HOUR) / MS_IN_MINUTE)
  const tone: SlaTone = left < SLA_CRITICAL_HOURS * MS_IN_HOUR ? 'negative' : left < SLA_WARNING_HOURS * MS_IN_HOUR ? 'attention' : 'positive'
  return { label: hours > 0 ? `${hours} ч ${minutes} мин` : `${minutes} мин`, tone, progress, isOverdue: false }
}
