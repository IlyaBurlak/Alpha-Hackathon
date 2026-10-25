import { DECISION_OPTIONS } from '@/entities/staff-application'
import type { DecisionType } from '@/entities/staff-application'
import { classNames } from '@/shared/lib'
import { Icon } from '@/shared/ui'

import styles from './DecisionOptions.module.css'

interface DecisionOptionsProps {
  /** The answers to show, in order. */
  types: readonly DecisionType[]
  selected: DecisionType
  /** The option the system advises; it carries a "recommended" mark. */
  recommended: DecisionType | null
  onSelect: (type: DecisionType) => void
}

/** The answers the bank can give, as a group of radio cards. */
export function DecisionOptions({ types, selected, recommended, onSelect }: DecisionOptionsProps) {
  return (
    <div className={styles.options} role="radiogroup" aria-label="Кредитное решение">
      {types.map((type) => {
        const option = DECISION_OPTIONS[type]
        return (
          <button
            key={type}
            type="button"
            role="radio"
            aria-checked={selected === type}
            className={classNames(styles.option, styles[option.tone])}
            onClick={() => onSelect(type)}
          >
            <span className={styles.icon}>
              <Icon name={option.icon} size={16} />
            </span>
            <span className={styles.text}>
              <b className={styles.title}>{option.title}</b>
              <small className={styles.subtitle}>{option.subtitle}</small>
            </span>
            {type === recommended && <span className={styles.star}>Рекомендовано</span>}
            <span className={styles.radio} />
          </button>
        )
      })}
    </div>
  )
}
