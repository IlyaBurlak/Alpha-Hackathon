import { classNames } from '@/shared/lib'
import { Icon } from '@/shared/ui'

import { getSla } from '../../lib/sla'
import type { StaffApplication } from '../../model/types'
import styles from './SlaLabel.module.css'

interface SlaLabelProps {
  application: Pick<StaffApplication, 'status' | 'receivedAt'>
  /** The moment to count from; passed in so a screen updates all its timers together. */
  now: number
  /** A clock icon instead of the progress bar, for the header of an application. */
  variant?: 'bar' | 'clock'
}

/** Time left to answer an application, coloured by urgency. */
export function SlaLabel({ application, now, variant = 'bar' }: SlaLabelProps) {
  const sla = getSla(application, now)
  if (!sla) return <span className={styles.empty}>—</span>

  return (
    <span className={classNames(styles.sla, styles[sla.tone])}>
      {variant === 'bar' && sla.progress > 0 && (
        <span className={styles.bar}>
          <i style={{ width: `${sla.progress * 100}%` }} />
        </span>
      )}
      {variant === 'clock' && <Icon name="clock" size={16} />}
      {variant === 'clock' ? `SLA: ${sla.label}` : sla.label}
    </span>
  )
}
