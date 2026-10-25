import { observer } from 'mobx-react-lite'

import { QUEUE_FILTERS, countByFilter, useQueueViewStore } from '@/entities/staff-application'
import type { QueueFilter, QueueMode, StaffApplication } from '@/entities/staff-application'
import { SearchField, Segmented, Switch } from '@/shared/ui'

import styles from './QueueToolbar.module.css'

interface QueueToolbarProps {
  mode: QueueMode
  /** The applications of the mode after "only mine" and the search, before the status tab: the numbers on the tabs count them. */
  scopedApplications: readonly StaffApplication[]
}

/** The status tabs, the "only mine" switch and the search box above the table. */
export const QueueToolbar = observer(function QueueToolbar({ mode, scopedApplications }: QueueToolbarProps) {
  const view = useQueueViewStore()
  const tabs = QUEUE_FILTERS.map(({ value, label }) => ({ value, label, count: countByFilter(scopedApplications, value) }))

  return (
    <div className={styles.toolbar}>
      {mode !== 'done' && (
        <Segmented<QueueFilter>
          size="compact"
          ariaLabel="Статус заявок"
          options={tabs}
          value={view.filter}
          onChange={(filter) => view.setFilter(filter)}
        />
      )}
      {mode === 'queue' && <Switch label="Только мои" isChecked={view.onlyMine} onChange={(isOnlyMine) => view.setOnlyMine(isOnlyMine)} />}
      <span className={styles.spacer} />
      <SearchField label="Поиск" placeholder="Номер, компания или ИНН" value={view.query} onChange={(query) => view.setQuery(query)} />
    </div>
  )
})
