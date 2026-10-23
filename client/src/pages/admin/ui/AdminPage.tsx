import { Typography } from '@alfalab/core-components/typography'
import { GearLineMIcon } from '@alfalab/icons-glyph/GearLineMIcon'

import { ExternalServicesPanel } from '@/widgets/external-services-panel'

import styles from './AdminPage.module.css'

export function AdminPage() {
  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <header className={styles.header}>
          <span className={styles.icon} aria-hidden="true">
            <GearLineMIcon />
          </span>
          <div className={styles.title}>
            <Typography.Title tag="h1" view="large" font="system" defaultMargins={false}>
              Внешние системы
            </Typography.Title>
            <Typography.Text view="primary-medium" color="secondary" defaultMargins={false}>
              Включайте и отключайте сервисы, чтобы проверить, как приложение работает при сбоях.
            </Typography.Text>
          </div>
        </header>
        <ExternalServicesPanel />
      </div>
    </main>
  )
}
