import { classNames } from '@/shared/lib'

import { getApprovalChance } from '../../lib/scoring/approval-chance'
import styles from './ScoreGauge.module.css'

const MAX_SCORE = 100
const RADIUS = 96
const ARC_PATH = 'M14 112 A96 96 0 0 1 206 112'
const ARC_LENGTH = Math.PI * RADIUS

interface ScoreGaugeProps {
  score: number
}

/** Half-circle gauge of the approval score with the chance label under it. */
export function ScoreGauge({ score }: ScoreGaugeProps) {
  const chance = getApprovalChance(score)
  const filledLength = (ARC_LENGTH * score) / MAX_SCORE

  return (
    <div className={classNames(styles.gauge, styles[chance.tone])}>
      <svg className={styles.gaugeSvg} width="220" height="122" viewBox="0 0 220 122" aria-hidden="true">
        <path d={ARC_PATH} fill="none" stroke="var(--color-fill)" strokeWidth="12" strokeLinecap="round" />
        <path
          d={ARC_PATH}
          fill="none"
          stroke="var(--tone)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${filledLength} ${ARC_LENGTH}`}
        />
      </svg>
      <div className={styles.gaugeValue}>
        {score}
        <small className={styles.gaugeScale}> из {MAX_SCORE}</small>
      </div>
      <div className={styles.gaugeLabel}>Шанс одобрения: {chance.label.toLowerCase()}</div>
    </div>
  )
}
