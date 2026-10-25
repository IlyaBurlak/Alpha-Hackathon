import { classNames } from '@/shared/lib'
import { Icon } from '@/shared/ui'

import type { ScoringFactor } from '../../model/types'
import styles from './ScoreFactors.module.css'

const MAX_FACTOR_POINTS = 25
const HALF_TRACK_PERCENT = 50
const MINUS = '−'

interface ScoreFactorsProps {
  factors: readonly ScoringFactor[]
}

function formatPoints(points: number): string {
  if (points > 0) return `+${points}`
  if (points < 0) return `${MINUS}${Math.abs(points)}`
  return '0'
}

function getPointsClassName(points: number): string {
  if (points > 0) return styles.pointsPositive
  if (points < 0) return styles.pointsNegative
  return styles.pointsZero
}

/** What raised or lowered the approval score, each factor on a bar centered at zero. */
export function ScoreFactors({ factors }: ScoreFactorsProps) {
  return (
    <>
      <div className={styles.legend}>
        <span>
          <Icon name="info" size={16} />
          Что повлияло на оценку
        </span>
      </div>
      <ul className={styles.factors}>
        {factors.map(({ title, description, points }) => (
          <li key={title} className={styles.factor}>
            <span>
              {title}
              <small className={styles.factorNote}>{description}</small>
            </span>
            <span className={styles.track}>
              <i
                className={classNames(styles.bar, points >= 0 ? styles.barPositive : styles.barNegative)}
                style={{ width: `${(Math.abs(points) / MAX_FACTOR_POINTS) * HALF_TRACK_PERCENT}%` }}
              />
            </span>
            <b className={classNames(styles.points, getPointsClassName(points))}>{formatPoints(points)}</b>
          </li>
        ))}
      </ul>
    </>
  )
}
