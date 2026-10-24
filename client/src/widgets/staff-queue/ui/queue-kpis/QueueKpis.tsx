import type { QueueSummary } from '@/entities/staff-application'
import { SLA_HOURS } from '@/entities/staff-application'

import styles from './QueueKpis.module.css'

interface QueueKpisProps {
  summary: QueueSummary
  onShowAll: () => void
  onShowReady: () => void
  onShowMine: () => void
  onShowOverdue: () => void
}

/** Four numbers above the queue; each one opens the list it counts. */
export function QueueKpis({ summary, onShowAll, onShowReady, onShowMine, onShowOverdue }: QueueKpisProps) {
  const items = [
    { key: 'today', tone: styles.info, label: 'Поступило за сутки', value: summary.receivedToday, note: `из ${summary.total} в системе`, onClick: onShowAll },
    { key: 'ready', tone: styles.positive, label: 'Ждут решения', value: summary.waitingForDecision, note: 'Скоринг пройден', onClick: onShowReady },
    { key: 'mine', tone: styles.dark, label: 'В работе у вас', value: summary.inWorkByEmployee, note: 'Без итогового решения', onClick: onShowMine },
    { key: 'overdue', tone: styles.negative, label: 'Просрочен SLA', value: summary.overdue, note: `Норматив ${SLA_HOURS} часа`, onClick: onShowOverdue },
  ]

  return (
    <div className={styles.kpis}>
      {items.map(({ key, tone, label, value, note, onClick }) => (
        <button key={key} type="button" className={`${styles.kpi} ${tone}`} onClick={onClick}>
          <small className={styles.label}>
            <i className={styles.dot} />
            {label}
          </small>
          <b className={styles.value}>{value}</b>
          <span className={styles.note}>{note}</span>
        </button>
      ))}
    </div>
  )
}
