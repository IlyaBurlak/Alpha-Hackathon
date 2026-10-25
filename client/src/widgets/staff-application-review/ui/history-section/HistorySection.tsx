import { formatMoment } from '@/entities/staff-application'
import type { HistoryEntry } from '@/entities/staff-application'

import { ReviewSection } from '../review-section/ReviewSection'
import styles from './HistorySection.module.css'

interface HistorySectionProps {
  history: readonly HistoryEntry[]
}

/** What happened to the application, the latest first. */
export function HistorySection({ history }: HistorySectionProps) {
  const entries = [...history].sort((first, second) => second.at.getTime() - first.at.getTime())

  return (
    <ReviewSection id="s-hist" title="История">
      <ol className={styles.list}>
        {entries.map((entry) => (
          <li key={`${entry.at.getTime()}-${entry.title}`} className={`${styles.item} ${styles[entry.tone]}`}>
            <span className={styles.dot} />
            <span>
              <b className={styles.title}>{entry.title}</b>
              {entry.description && <small className={styles.description}>{entry.description}</small>}
            </span>
            <time className={styles.time} dateTime={entry.at.toISOString()}>
              {formatMoment(entry.at)}
            </time>
          </li>
        ))}
      </ol>
    </ReviewSection>
  )
}
