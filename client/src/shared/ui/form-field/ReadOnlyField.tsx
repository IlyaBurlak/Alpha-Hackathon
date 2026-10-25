import { classNames } from '@/shared/lib'

import styles from './Field.module.css'
import { Icon } from '../icon'

interface ReadOnlyFieldProps {
  label: string
  value: string
  className?: string
}

/** A value taken from the bank profile: shown like a field, with a lock instead of an editor. */
export function ReadOnlyField({ label, value, className }: ReadOnlyFieldProps) {
  return (
    <div className={classNames(styles.field, styles.readonly, className)}>
      <span className={styles.label}>{label}</span>
      <input className={styles.control} value={value} readOnly tabIndex={-1} aria-label={label} />
      <span className={styles.lock}>
        <Icon name="lock" size={18} />
      </span>
    </div>
  )
}
