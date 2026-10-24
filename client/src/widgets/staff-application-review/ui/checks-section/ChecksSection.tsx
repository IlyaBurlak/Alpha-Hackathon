import { CHECK_LEVELS } from '@/entities/staff-application'
import type { CheckLevel, CheckResult } from '@/entities/staff-application'
import { classNames } from '@/shared/lib'
import { Icon } from '@/shared/ui'
import type { IconName } from '@/shared/ui'

import { ReviewSection } from '../review-section/ReviewSection'
import styles from './ChecksSection.module.css'

const LEVEL_ICONS: Record<CheckLevel, IconName> = {
  [CHECK_LEVELS.ok]: 'check',
  [CHECK_LEVELS.warning]: 'warning',
  [CHECK_LEVELS.fail]: 'close',
}

interface ChecksSectionProps {
  checks: readonly CheckResult[]
}

/** The checks the system ran: the register, the tax service, the credit bureau, the courts and others. */
export function ChecksSection({ checks }: ChecksSectionProps) {
  const passed = checks.filter(({ level }) => level === CHECK_LEVELS.ok).length
  const hasFailed = checks.some(({ level }) => level === CHECK_LEVELS.fail)
  const summaryTone = passed === checks.length ? styles.summaryPositive : hasFailed ? styles.summaryNegative : styles.summaryAttention

  return (
    <ReviewSection
      id="s-chk"
      title="Результаты проверок"
      aside={checks.length > 0 && <span className={classNames(styles.summary, summaryTone)}>{passed} из {checks.length} пройдено</span>}
    >
      {checks.length === 0 ? (
        <p className={styles.pending}>Проверки выполняются вместе со скорингом.</p>
      ) : (
        <ul className={styles.list}>
          {checks.map(({ title, description, level, resultLabel }) => (
            <li key={title} className={classNames(styles.item, styles[level])}>
              <span className={styles.icon}>
                <Icon name={LEVEL_ICONS[level]} size={16} />
              </span>
              <span>
                <b className={styles.title}>{title}</b>
                <small className={styles.description}>{description}</small>
              </span>
              <span className={styles.result}>{resultLabel}</span>
            </li>
          ))}
        </ul>
      )}
    </ReviewSection>
  )
}
