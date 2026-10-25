import { AUTO_APPROVAL_SCORE_FROM, REFUSAL_SCORE_BELOW } from '@/entities/staff-application'
import { classNames } from '@/shared/lib'

import styles from './StaffScoreGauge.module.css'

const RADIUS = 90
const ARC_PATH = 'M15 105 A90 90 0 0 1 195 105'
const ARC_LENGTH = Math.PI * RADIUS
const MAX_SCORE = 100

interface ZoneView {
  label: string
  tone: string
}

function getZone(score: number): ZoneView {
  if (score >= AUTO_APPROVAL_SCORE_FROM) return { label: 'Зона автоодобрения', tone: styles.positive }
  if (score >= REFUSAL_SCORE_BELOW) return { label: 'Зона ручного решения', tone: styles.attention }
  return { label: 'Зона отказа', tone: styles.negative }
}

interface StaffScoreGaugeProps {
  score: number
}

/** Half-circle gauge of the score with the name of the zone the score falls into. */
export function StaffScoreGauge({ score }: StaffScoreGaugeProps) {
  const zone = getZone(score)

  return (
    <div className={classNames(styles.gauge, zone.tone)}>
      <svg width="210" height="116" viewBox="0 0 210 116" aria-hidden="true">
        <path d={ARC_PATH} fill="none" stroke="var(--color-fill)" strokeWidth="12" strokeLinecap="round" />
        <path
          d={ARC_PATH}
          fill="none"
          stroke="var(--tone)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${(ARC_LENGTH * score) / MAX_SCORE} ${ARC_LENGTH}`}
        />
      </svg>
      <div className={styles.value}>
        {score}
        <small className={styles.scale}>из {MAX_SCORE}</small>
      </div>
      <div className={styles.label}>{zone.label}</div>
    </div>
  )
}
