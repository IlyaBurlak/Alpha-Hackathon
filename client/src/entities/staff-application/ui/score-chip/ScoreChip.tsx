import { classNames } from '@/shared/lib'

import { AUTO_APPROVAL_SCORE_FROM, REFUSAL_SCORE_BELOW } from '../../config/review-rules'
import styles from './ScoreChip.module.css'

interface ScoreChipProps {
  /** `null` while the model is still calculating. */
  score: number | null
}

/** The score of the model on a tinted tile: green from the auto-approval level, red below the refusal level. */
export function ScoreChip({ score }: ScoreChipProps) {
  if (score === null) return <span className={styles.pending}>…</span>
  const tone = score >= AUTO_APPROVAL_SCORE_FROM ? styles.high : score >= REFUSAL_SCORE_BELOW ? styles.medium : styles.low
  return <span className={classNames(styles.chip, tone)}>{score}</span>
}
