import { classNames } from '@/shared/lib'

import { getApprovalChance } from '../../lib/scoring/approval-chance'
import styles from './ApprovalChanceMeter.module.css'

const BAR_LEVELS = [1, 2, 3, 4] as const

interface ApprovalChanceMeterProps {
  score: number
}

/** Label and four bars: the short form of the approval chance for a product card. */
export function ApprovalChanceMeter({ score }: ApprovalChanceMeterProps) {
  const chance = getApprovalChance(score)

  return (
    <div className={styles[chance.tone]}>
      <div className={styles.chanceHeader}>
        <span>Шанс одобрения</span>
        <b>{chance.label}</b>
      </div>
      <div className={styles.bars}>
        {BAR_LEVELS.map((level) => (
          <i key={level} className={classNames(styles.chanceBar, level <= chance.level && styles.chanceBarOn)} />
        ))}
      </div>
    </div>
  )
}
