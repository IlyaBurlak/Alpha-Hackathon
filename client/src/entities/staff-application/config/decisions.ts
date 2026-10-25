import type { IconName } from '@/shared/ui'

import { DECISION_TYPES, STAFF_STATUSES } from '../model/types'
import type { DecisionType, StaffStatus } from '../model/types'

export type DecisionTone = 'positive' | 'attention' | 'info' | 'negative'

export interface DecisionOption {
  title: string
  subtitle: string
  icon: IconName
  tone: DecisionTone
  /** The label of the button that confirms the decision. */
  buttonLabel: string
  /** The status the application gets after this decision. */
  resultingStatus: StaffStatus
  /** What the history says. */
  historyTitle: string
}

export const DECISION_OPTIONS: Record<DecisionType, DecisionOption> = {
  [DECISION_TYPES.approve]: {
    title: 'Одобрить',
    subtitle: 'На запрошенных условиях',
    icon: 'check',
    tone: 'positive',
    buttonLabel: 'Одобрить заявку',
    resultingStatus: STAFF_STATUSES.approved,
    historyTitle: 'Заявка одобрена',
  },
  [DECISION_TYPES.offer]: {
    title: 'Предложить другие условия',
    subtitle: 'Изменить сумму, срок или ставку',
    icon: 'swap',
    tone: 'attention',
    buttonLabel: 'Отправить предложение',
    resultingStatus: STAFF_STATUSES.offer,
    historyTitle: 'Клиенту предложены другие условия',
  },
  [DECISION_TYPES.clarify]: {
    title: 'Запросить данные',
    subtitle: 'Документы или пояснения',
    icon: 'document',
    tone: 'info',
    buttonLabel: 'Запросить данные',
    resultingStatus: STAFF_STATUSES.clarify,
    historyTitle: 'Запрошены дополнительные данные',
  },
  [DECISION_TYPES.reject]: {
    title: 'Отказать',
    subtitle: 'С указанием причины',
    icon: 'close',
    tone: 'negative',
    buttonLabel: 'Отказать',
    resultingStatus: STAFF_STATUSES.rejected,
    historyTitle: 'Отказ по заявке',
  },
}

export const DECISION_ORDER: readonly DecisionType[] = [
  DECISION_TYPES.approve,
  DECISION_TYPES.offer,
  DECISION_TYPES.clarify,
  DECISION_TYPES.reject,
]
