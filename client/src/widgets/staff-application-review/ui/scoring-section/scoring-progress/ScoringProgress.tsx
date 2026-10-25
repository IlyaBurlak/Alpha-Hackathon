import { Button } from '@/shared/ui'

import styles from './ScoringProgress.module.css'

interface ScoringProgressProps {
  /** The employee has just restarted the scoring: the page follows it for a short while by itself. */
  isRestarted: boolean
  onRefresh: () => void
}

/** The scoring is running: a moving bar, what to expect and a way to look at the result by hand. */
export function ScoringProgress({ isRestarted, onRefresh }: ScoringProgressProps) {
  return (
    <div className={styles.progress} role="status" aria-live="polite">
      <div className={styles.track} aria-hidden="true">
        <i className={styles.bar} />
      </div>
      <h3>{isRestarted ? 'Скоринг перезапущен' : 'Скоринг выполняется'}</h3>
      <p>
        {isRestarted
          ? 'Обычно это занимает несколько секунд. Результат появится здесь сам; если не появился, нажмите «Обновить результат».'
          : 'Результат появится после завершения. Нажмите «Обновить результат» или откройте заявку позже.'}
      </p>
      <Button view="secondary" size="small" onClick={onRefresh}>
        Обновить результат
      </Button>
    </div>
  )
}
