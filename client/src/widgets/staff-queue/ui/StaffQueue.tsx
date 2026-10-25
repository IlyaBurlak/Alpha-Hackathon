import { Loader } from '@alfalab/core-components/loader'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'

import { useCurrentEmployee } from '@/entities/employee'
import {
  selectModeApplications,
  selectQueueRows,
  summarizeQueue,
  useQueueViewStore,
  useStaffApplicationListStore,
} from '@/entities/staff-application'
import type { QueueMode } from '@/entities/staff-application'
import { AssignmentStore, TakeApplicationButton } from '@/features/assign-application'
import { useNow } from '@/shared/lib'
import { Button, EmptyState, useToast } from '@/shared/ui'

import { QUEUE_TITLES } from '../lib/queue-text'
import { QueueKpis } from './queue-kpis/QueueKpis'
import { QueueTable } from './queue-table/QueueTable'
import { QueueToolbar } from './queue-toolbar/QueueToolbar'
import styles from './StaffQueue.module.css'

/** How often the deadlines on screen are recounted. */
const CLOCK_INTERVAL_MS = 30_000

interface StaffQueueProps {
  mode: QueueMode
}

/** One of the three lists of the staff cabinet: the numbers, the filters, the search and the table. */
export const StaffQueue = observer(function StaffQueue({ mode }: StaffQueueProps) {
  const showToast = useToast()
  const employee = useCurrentEmployee()
  const view = useQueueViewStore()
  const list = useStaffApplicationListStore()
  const [assignment] = useState(() => new AssignmentStore(list))
  const now = useNow(CLOCK_INTERVAL_MS)
  const { state } = list
  const titles = QUEUE_TITLES[mode]

  const renderBody = () => {
    if (state.status === 'idle' || state.status === 'loading') return <Loader />
    if (state.status === 'error') {
      return (
        <EmptyState
          title="Не удалось загрузить заявки"
          text={state.message}
          action={
            <Button view="secondary" onClick={() => void list.load()}>
              Повторить
            </Button>
          }
        />
      )
    }

    const modeApplications = selectModeApplications(state.applications, mode, employee.id)
    const rows = selectQueueRows(state.applications, {
      mode,
      filter: view.filter,
      onlyMine: view.onlyMine,
      query: view.query,
      sortKey: view.sortKey,
      direction: view.direction,
      employeeId: employee.id,
      now,
    })
    const summary = summarizeQueue(state.applications, employee.id, now)

    return (
      <>
        {mode === 'queue' && (
          <QueueKpis
            summary={summary}
            onShowAll={() => view.setFilter('all')}
            onShowReady={() => view.setFilter('ready')}
            onShowMine={() => view.showMyWork()}
            onShowOverdue={() => view.showMostUrgent()}
          />
        )}
        <QueueToolbar mode={mode} modeApplications={modeApplications} />
        {rows.length > 0 ? (
          <QueueTable
            applications={rows}
            employee={employee}
            now={now}
            renderTake={(application) => (
              <TakeApplicationButton
                applicationId={application.id}
                employee={employee}
                store={assignment}
                onTaken={() => showToast('Заявка в работе у вас')}
              />
            )}
          />
        ) : (
          <EmptyState
            title="Заявок нет"
            text={view.query.trim() ? 'Проверьте номер, название или ИНН.' : 'Здесь появятся заявки по выбранному фильтру.'}
          />
        )}
      </>
    )
  }

  return (
    <>
      <div className={styles.header}>
        <div>
          <h1>{titles.title}</h1>
          <p className={styles.subtitle}>{titles.subtitle}</p>
        </div>
      </div>
      {renderBody()}
    </>
  )
})
