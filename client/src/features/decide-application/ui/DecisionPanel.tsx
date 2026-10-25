import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import type { ReactNode } from 'react'

import { findEmployee, useCurrentEmployee } from '@/entities/employee'
import { STAFF_STATUSES } from '@/entities/staff-application'
import type { StaffApplication, StaffApplicationDetailStore, StaffApplicationListStore } from '@/entities/staff-application'
import { Icon, useToast } from '@/shared/ui'

import { ReopenDecisionStore } from '../model/reopen-decision-store'
import styles from './DecisionPanel.module.css'
import { DecisionFormPanel } from './decision-form-panel/DecisionFormPanel'
import { DecisionResult } from './decision-result/DecisionResult'

interface DecisionPanelProps {
  application: StaffApplication
  list: StaffApplicationListStore
  detail: StaffApplicationDetailStore
  /** Called with the text to tell the employee after the decision is saved. */
  onDecided: (message: string) => void
  /** The button that takes the application: only its responsible employee may decide. */
  takeAction: ReactNode
}

/** The right-hand column of an application: the advice of the system and the way to give the answer. */
export const DecisionPanel = observer(function DecisionPanel({ application, list, detail, onDecided, takeAction }: DecisionPanelProps) {
  const employee = useCurrentEmployee()
  const [reopenStore] = useState(() => new ReopenDecisionStore(list, detail))
  const { decision } = application

  const showToast = useToast()

  const handleReopen = async () => {
    const reopened = await reopenStore.reopen(application.id, { id: employee.id, name: employee.name })
    if (!reopened && reopenStore.errorMessage) showToast(reopenStore.errorMessage)
  }

  if (application.status === STAFF_STATUSES.scoring) {
    return (
      <div className={styles.panel}>
        <div className={styles.pending}>
          <span className={styles.pendingKind}>
            <Icon name="clock" size={16} />
            Решение
          </span>
          <h3 className={styles.pendingTitle}>Ждём результат скоринга</h3>
          <p className={styles.pendingText}>Решение станет доступно после проверок и расчёта балла.</p>
        </div>
      </div>
    )
  }

  const isDecided = decision !== null && application.status !== STAFF_STATUSES.ready
  const { assigneeId } = application
  if (!isDecided && assigneeId !== employee.id) {
    const assigneeName = assigneeId === null ? null : (findEmployee(assigneeId)?.name ?? 'другой сотрудник')
    return (
      <div className={styles.panel}>
        <div className={styles.pending}>
          <span className={styles.pendingKind}>
            <Icon name="person" size={16} />
            Решение
          </span>
          <h3 className={styles.pendingTitle}>{assigneeName === null ? 'Сначала возьмите заявку' : 'Заявка в работе у другого сотрудника'}</h3>
          <p className={styles.pendingText}>
            {assigneeName === null
              ? 'Решение принимает ответственный по заявке. Пока заявка никому не назначена, принять его нельзя.'
              : `Решение принимает ответственный по заявке: ${assigneeName}.`}
          </p>
          {assigneeName === null && <div className={styles.pendingActions}>{takeAction}</div>}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.panel}>
      {isDecided && decision ? (
        <DecisionResult application={application} decision={decision} isSaving={reopenStore.isSaving} onReopen={() => void handleReopen()} />
      ) : (
        <DecisionFormPanel key={application.id} application={application} list={list} detail={detail} onDecided={onDecided} />
      )}
    </div>
  )
})
