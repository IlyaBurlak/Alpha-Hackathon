import { DECISION_OPTIONS } from '@/entities/staff-application'
import type { Recommendation } from '@/entities/staff-application'
import { formatMoneyShort, formatMonths } from '@/shared/lib'
import { Icon } from '@/shared/ui'

import styles from './RecommendationCard.module.css'

const MAX_REASONS = 4

interface RecommendationCardProps {
  recommendation: Recommendation
}

/** What the system advises to do with the application, and why. */
export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const option = DECISION_OPTIONS[recommendation.type]
  const { offer } = recommendation

  return (
    <div className={`${styles.card} ${styles[option.tone]}`}>
      <span className={styles.kind}>
        <Icon name="spark" size={16} />
        Рекомендация системы
      </span>
      <h3 className={styles.title}>
        {option.title}
        {offer && `: ${formatMoneyShort(offer.amount)} на ${formatMonths(offer.termInMonths)}`}
      </h3>
      <ul className={styles.reasons}>
        {recommendation.reasons.slice(0, MAX_REASONS).map((reason) => (
          <li key={reason}>
            <Icon name="info" size={16} />
            <span>{reason}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
