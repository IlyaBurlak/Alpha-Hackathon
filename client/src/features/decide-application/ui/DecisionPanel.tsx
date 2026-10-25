import { observer } from 'mobx-react-lite'
import { useState } from 'react'

import { useCurrentEmployee } from '@/entities/employee'
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
}

/** The right-hand column of an application: the advice of the system and the way to give the answer. */
export const DecisionPanel = observer(function DecisionPanel({ application, list, detail, onDecided }: DecisionPanelProps) {
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

  return (
    <div className={styles.panel}>
      {decision && application.status !== STAFF_STATUSES.ready ? (
        <DecisionResult application={application} decision={decision} isSaving={reopenStore.isSaving} onReopen={() => void handleReopen()} />
      ) : (
        <DecisionFormPanel key={application.id} application={application} list={list} detail={detail} onDecided={onDecided} />
      )}
    </div>
  )
})
