import type { ReactNode } from 'react'

import { classNames } from '@/shared/lib'
import { Icon } from '@/shared/ui'
import type { IconName } from '@/shared/ui'

import styles from './WizardSection.module.css'

interface WizardSectionProps {
  title: string
  /** Where the data of the section comes from or what to do with it, at the right of the title. */
  source?: { icon?: IconName; text: string }
  /** A control at the right of the title, instead of the source. */
  action?: ReactNode
  /** `first` sits right under the legend, `compact` is a little tighter than the default. */
  spacing?: 'default' | 'first' | 'compact'
  children: ReactNode
}

/** A titled block of the data and review steps. */
export function WizardSection({ title, source, action, spacing = 'default', children }: WizardSectionProps) {
  return (
    <section className={classNames(styles.section, spacing === 'first' && styles.first, spacing === 'compact' && styles.compact)}>
      <div className={styles.header}>
        <h2>{title}</h2>
        {source && (
          <span className={styles.source}>
            {source.icon && <Icon name={source.icon} size={16} />}
            {source.text}
          </span>
        )}
        {action}
      </div>
      {children}
    </section>
  )
}
