import { APPLICATION_STATUSES, TIMELINE_STEPS, getTimelineStates } from '@/entities/application'
import type { ApplicationStatus, TimelineStepState } from '@/entities/application'
import { Icon } from '@/shared/ui'
import { formatWhen } from '@/shared/lib'

import styles from './StatusTimeline.module.css'

interface StatusTimelineProps {
  status: ApplicationStatus
  /** When each step was completed, if known; shown for completed steps only. */
  completedAt: ReadonlyArray<Date | null>
}

const STOP_TEXTS: Partial<Record<ApplicationStatus, string>> = {
  [APPLICATION_STATUSES.rejected]: 'Отказ, причины выше',
  [APPLICATION_STATUSES.offerDeclined]: 'Вы отказались от других условий',
}

function getStepText(state: TimelineStepState, status: ApplicationStatus, description: string): string {
  if (state === 'stop') return STOP_TEXTS[status] ?? 'Отозвана'
  if (state === 'wait') return status === APPLICATION_STATUSES.offered ? 'Ждём ваш ответ на другие условия' : 'Ждём вашу подпись'
  return description
}

function StepMarker({ state }: { state: TimelineStepState }) {
  if (state === 'done') return <Icon name="check" size={14} />
  if (state === 'stop') return <Icon name="close" size={14} />
  if (state === 'wait') return <Icon name="pen" size={13} />
  return null
}

/** The five steps from sending the application to the money on the account, with the current one marked. */
export function StatusTimeline({ status, completedAt }: StatusTimelineProps) {
  const states = getTimelineStates(status)

  return (
    <ol className={styles.timeline}>
      {TIMELINE_STEPS.map(({ title, description }, index) => {
        const state = states[index]
        return (
          <li key={title} className={`${styles.timelineItem} ${styles[state]}`}>
            <span className={styles.marker}>
              <StepMarker state={state} />
            </span>
            <div>
              <div className={styles.timelineHeader}>
                <b className={styles.timelineTitle}>{title}</b>
                {state === 'done' && completedAt[index] && (
                  <time className={styles.timelineTime}>{formatWhen(completedAt[index])}</time>
                )}
              </div>
              <p className={styles.timelineText}>{getStepText(state, status, description)}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
