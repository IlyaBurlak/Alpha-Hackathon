import type { StatusTone } from '@/shared/ui'

import { STAFF_STATUSES } from '../model/types'
import type { StaffStatus } from '../model/types'

export interface StatusView {
  label: string
  tone: StatusTone
  /** The dot blinks while the model is still calculating. */
  isBlinking: boolean
}

export const STAFF_STATUS_VIEWS: Record<StaffStatus, StatusView> = {
  [STAFF_STATUSES.scoring]: { label: 'На скоринге', tone: 'info', isBlinking: true },
  [STAFF_STATUSES.ready]: { label: 'Обработано успешно', tone: 'positive', isBlinking: false },
  [STAFF_STATUSES.clarify]: { label: 'На уточнении', tone: 'attention', isBlinking: false },
  [STAFF_STATUSES.offer]: { label: 'Предложены условия', tone: 'attention', isBlinking: false },
  [STAFF_STATUSES.approved]: { label: 'Одобрено', tone: 'default', isBlinking: false },
  [STAFF_STATUSES.rejected]: { label: 'Отказ', tone: 'negative', isBlinking: false },
}
