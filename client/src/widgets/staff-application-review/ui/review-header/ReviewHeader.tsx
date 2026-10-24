import type { ReactNode } from 'react'
import { Link } from 'react-router'

import { SlaLabel, StaffStatusDot, formatMoment } from '@/entities/staff-application'
import type { StaffApplication } from '@/entities/staff-application'
import { ROUTES } from '@/shared/config'
import { Icon } from '@/shared/ui'
import styles from './ReviewHeader.module.css'

interface ReviewHeaderProps {
  application: StaffApplication
  now: number
  /** The control that shows and changes the responsible employee. */
  assignee: ReactNode
}

/** The title of an application: the company, the status, the deadline and who is responsible. */
export function ReviewHeader({ application, now, assignee }: ReviewHeaderProps) {
  return (
    <>
      <Link className={styles.crumb} to={ROUTES.staff}>
        <Icon name="left" size={18} />
        Очередь заявок
      </Link>
      <div className={styles.header}>
        <div>
          <h1>{application.company.name}</h1>
          <div className={styles.meta}>
            <StaffStatusDot status={application.status} />
            <span>Заявка №&nbsp;{application.number}</span>
            <span>{application.product.name}</span>
            <span>Поступила {formatMoment(application.receivedAt)}</span>
            <SlaLabel application={application} now={now} variant="clock" />
          </div>
        </div>
        <div className={styles.actions}>{assignee}</div>
      </div>
    </>
  )
}
