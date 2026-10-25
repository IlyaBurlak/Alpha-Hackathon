import { Alert } from '@alfalab/core-components/alert'
import { Button } from '@alfalab/core-components/button'
import { Status } from '@alfalab/core-components/status'
import { Typography } from '@alfalab/core-components/typography'
import { ArrowsCwMIcon } from '@alfalab/icons-glyph/ArrowsCwMIcon'
import { observer } from 'mobx-react-lite'

import { EXTERNAL_SERVICES, useExternalServicesStore } from '@/entities/external-service'

import styles from './PanelSummary.module.css'

const TOTAL_SERVICES = EXTERNAL_SERVICES.length

export const PanelSummary = observer(function PanelSummary() {
  const store = useExternalServicesStore()
  const { activeCount, inactiveCount, hasConnectionProblem } = store

  return (
    <section className={styles.summary} aria-label="Сводка по сервисам">
      <div className={styles.row}>
        <div className={styles.counter}>
          <Typography.Title tag="div" view="large" font="system" defaultMargins={false}>
            {activeCount} из {TOTAL_SERVICES}
          </Typography.Title>
          <Typography.Text view="primary-small" color="secondary" defaultMargins={false}>
            сервисов работают
          </Typography.Text>
        </div>
        <div className={styles.actions}>
          {inactiveCount === 0 && !hasConnectionProblem && (
            <Status view="soft" color="green" size={32}>
              Все системы в норме
            </Status>
          )}
          {inactiveCount > 0 && (
            <Status view="soft" color="red" size={32}>
              Отключено: {inactiveCount}
            </Status>
          )}
          <Button
            view="secondary"
            size={40}
            leftAddons={<ArrowsCwMIcon />}
            onClick={() => void store.loadAll()}
          >
            Обновить статусы
          </Button>
        </div>
      </div>

      {inactiveCount > 0 && (
        <Alert view="attention" title="Моделируется сбой внешних систем">
          Приложение сейчас работает так, как будто отключённые сервисы недоступны.
        </Alert>
      )}
      {hasConnectionProblem && (
        <Alert view="negative" title="Нет связи с внешними системами">
          Проверьте, что сервис external-systems запущен, и обновите статусы.
        </Alert>
      )}
    </section>
  )
})
