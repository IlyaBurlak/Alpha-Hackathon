import type { ScoringFactor } from '@/entities/staff-application'
import { classNames } from '@/shared/lib'

import styles from './FactorRows.module.css'

const MAX_FACTOR_POINTS = 25
const HALF_TRACK_PERCENT = 50
const MINUS = '−'

function formatPoints(points: number): string {
  if (points > 0) return `+${points}`
  if (points < 0) return `${MINUS}${Math.abs(points)}`
  return '0'
}

interface FactorRowsProps {
  factors: readonly ScoringFactor[]
}

/** How much every factor moved the score from the base level: a bar to the right of the middle or to the left of it. */
export function FactorRows({ factors }: FactorRowsProps) {
  return (
    <ul className={styles.rows}>
      {factors.map(({ title, description, points }) => (
        <li key={title} className={styles.row}>
          <span>
            {title}
            <small className={styles.note}>{description}</small>
          </span>
          <span className={styles.track}>
            <i
              className={classNames(styles.bar, points >= 0 ? styles.gain : styles.loss)}
              style={{ width: `${(Math.abs(points) / MAX_FACTOR_POINTS) * HALF_TRACK_PERCENT}%` }}
            />
          </span>
          <b className={classNames(styles.points, points > 0 ? styles.gain : points < 0 ? styles.loss : styles.zero)}>{formatPoints(points)}</b>
        </li>
      ))}
    </ul>
  )
}
