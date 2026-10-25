import { Skeleton } from '@alfalab/core-components/skeleton'
import { Status } from '@alfalab/core-components/status'
import { Typography } from '@alfalab/core-components/typography'
import type { ReactNode } from 'react'

import { getServiceStatusView } from '../lib/service-status-view'
import type { ExternalServiceInfo, ServiceState } from '../model/types'
import { ServiceIcon } from './ServiceIcon'
import styles from './ServiceCard.module.css'

interface ServiceCardProps {
  service: ExternalServiceInfo
  state: ServiceState
  /** Control that changes the service availability, supplied by the composing layer. */
  action: ReactNode
}

function getNotice(state: ServiceState): string | null {
  if (state.kind === 'error') return state.message
  if (state.kind === 'ready') return state.notice
  return null
}

export function ServiceCard({ service, state, action }: ServiceCardProps) {
  const status = getServiceStatusView(state)
  const notice = getNotice(state)

  return (
    <article className={styles.card} data-status={status.color} aria-label={service.title}>
      <header className={styles.header}>
        <span className={styles.icon} aria-hidden="true">
          <ServiceIcon serviceId={service.id} />
        </span>
        <Skeleton visible={state.kind === 'loading'}>
          <Status view="soft" color={status.color} size={24}>
            {status.label}
          </Status>
        </Skeleton>
      </header>

      <div className={styles.body}>
        <Typography.Title tag="h2" view="xsmall" font="system" defaultMargins={false}>
          {service.title}
        </Typography.Title>
        <Typography.Text view="primary-small" color="secondary" defaultMargins={false}>
          {service.description}
        </Typography.Text>
      </div>

      {notice && (
        <Typography.Text role="alert" view="primary-small" color="negative" defaultMargins={false}>
          {notice}
        </Typography.Text>
      )}

      <footer className={styles.action}>{action}</footer>
    </article>
  )
}
