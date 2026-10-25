import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'

import { EXTERNAL_SERVICES, ServiceCard, useExternalServicesStore } from '@/entities/external-service'
import { ServiceAvailabilitySwitch } from '@/features/toggle-service-availability'

import styles from './ExternalServicesPanel.module.css'
import { PanelSummary } from './PanelSummary'

export const ExternalServicesPanel = observer(function ExternalServicesPanel() {
  const store = useExternalServicesStore()

  useEffect(() => {
    void store.loadAll()
  }, [store])

  return (
    <div className={styles.panel}>
      <PanelSummary />
      <ul className={styles.grid} aria-label="Внешние сервисы">
        {EXTERNAL_SERVICES.map((service) => (
          <li key={service.id} className={styles.item}>
            <ServiceCard
              service={service}
              state={store.states[service.id]}
              action={<ServiceAvailabilitySwitch serviceId={service.id} />}
            />
          </li>
        ))}
      </ul>
    </div>
  )
})
