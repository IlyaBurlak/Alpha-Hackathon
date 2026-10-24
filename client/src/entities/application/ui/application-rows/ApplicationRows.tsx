import { Link } from 'react-router'

import { getApplicationEditPath, getApplicationPath } from '@/shared/config'
import { Icon, StatusDot } from '@/shared/ui'

import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_TONES } from '../../lib/status/application-status'
import { getApplicationTitle } from '../../lib/status/application-title'
import { formatDate, formatMoney } from '../../lib/format/format'
import { APPLICATION_STATUSES } from '../../model/types'
import type { Application } from '../../model/types'
import styles from './ApplicationRows.module.css'

interface ApplicationRowsProps {
  applications: readonly Application[]
  ariaLabel: string
}

function getApplicationHref(application: Application): string {
  return application.status === APPLICATION_STATUSES.draft
    ? getApplicationEditPath(application.id)
    : getApplicationPath(application.id)
}

function getApplicationMeta(application: Application): string {
  const date = formatDate(application.createdAt)
  return application.status === APPLICATION_STATUSES.draft ? `Черновик, ${date}` : `№ ${application.id}, ${date}`
}

export function ApplicationRows({ applications, ariaLabel }: ApplicationRowsProps) {
  return (
    <ul className={styles.rows} aria-label={ariaLabel}>
      {applications.map((application) => (
        <li key={application.id}>
          <Link className={styles.row} to={getApplicationHref(application)}>
            <span>
              <b className={styles.title}>{getApplicationTitle(application)}</b>
              <small className={styles.meta}>{getApplicationMeta(application)}</small>
            </span>
            <span className={styles.amount}>{formatMoney(application.sum)}</span>
            <StatusDot tone={APPLICATION_STATUS_TONES[application.status]}>
              {APPLICATION_STATUS_LABELS[application.status]}
            </StatusDot>
            <span className={styles.arrow}>
              <Icon name="right" size={20} />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
