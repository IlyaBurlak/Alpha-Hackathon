import { Status } from '@alfalab/core-components/status'
import { Typography } from '@alfalab/core-components/typography'
import type { ReactNode } from 'react'

import { APPLICATION_STATUS_LABELS, formatCreditTime, formatDate, formatMoney } from '../lib/format'
import type { Application } from '../model/types'
import styles from './ApplicationCard.module.css'

interface ApplicationCardProps {
  application: Application
  /** Control that opens the application, supplied by the composing layer. */
  action?: ReactNode
}

export function ApplicationCard({ application, action }: ApplicationCardProps) {
  const { productChoice } = application

  return (
    <article className={styles.card} aria-label={`Заявка №${application.id}`}>
      <header className={styles.header}>
        <Typography.Title tag="h3" view="xsmall" font="system" defaultMargins={false}>
          Заявка №{application.id}
        </Typography.Title>
        <Status view="soft" color="blue" size={24}>
          {APPLICATION_STATUS_LABELS[application.status]}
        </Status>
      </header>
      <Typography.Text view="primary-medium" defaultMargins={false}>
        {formatMoney(application.sum)} на {formatCreditTime(application.creditTime)}
      </Typography.Text>
      <Typography.Text view="primary-small" color="secondary" defaultMargins={false}>
        Создана {formatDate(application.createdAt)}
        {' · '}
        {productChoice.kind === 'selected' ? productChoice.product.name : 'продукт не выбран'}
      </Typography.Text>
      {action}
    </article>
  )
}
