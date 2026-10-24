import { DECISION_OPTIONS, formatMoment } from '@/entities/staff-application'
import type { RecordedDecision, StaffApplication } from '@/entities/staff-application'
import { findEmployee } from '@/entities/employee'
import { formatMoney, formatMonths, formatPercent } from '@/shared/lib'
import { Button } from '@/shared/ui'

import styles from './DecisionResult.module.css'

interface DecisionResultProps {
  application: StaffApplication
  decision: RecordedDecision
  isSaving: boolean
  onReopen: () => void
}

function describeDecision(decision: RecordedDecision, application: StaffApplication): string {
  if (decision.type === 'offer') {
    return `${formatMoney(decision.amount)} на ${formatMonths(decision.termInMonths)} под ${formatPercent(decision.rate)}`
  }
  if (decision.type === 'clarify') return decision.documents.join(', ')
  if (decision.type === 'reject') return decision.reason
  const rate = application.scoring?.rate
  const terms = `${formatMoney(application.amount)} на ${formatMonths(application.termInMonths)}`
  return rate === undefined ? terms : `${terms} под ${formatPercent(rate)}`
}

/** The answer the bank has given: what was decided, by whom, and a way to take it back while the client is answering. */
export function DecisionResult({ application, decision, isSaving, onReopen }: DecisionResultProps) {
  const option = DECISION_OPTIONS[decision.type]
  const canReopen = application.status === 'offer' || application.status === 'clarify'
  const author = findEmployee(decision.byEmployeeId)?.name

  return (
    <div className={`${styles.result} ${styles[option.tone]}`}>
      <span className={styles.kind}>Решение принято</span>
      <h3 className={styles.title}>{option.historyTitle}</h3>
      <p className={styles.text}>{describeDecision(decision, application)}</p>
      {decision.comment && <p className={styles.text}>«{decision.comment}»</p>}
      <p className={styles.small}>
        {author ? `${author}, ` : ''}
        {formatMoment(decision.at)}
      </p>
      {canReopen && (
        <>
          <p className={styles.reopenNote}>Ответ клиента появится в истории. Решение можно пересмотреть.</p>
          <div className={styles.reopen}>
            <Button view="secondary" isBlock disabled={isSaving} onClick={onReopen}>
              Изменить решение
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
