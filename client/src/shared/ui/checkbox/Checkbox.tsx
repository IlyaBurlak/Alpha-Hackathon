import { classNames } from '@/shared/lib'

import styles from './Checkbox.module.css'

interface CheckboxProps {
  label: string
  description?: string
  isChecked: boolean
  onChange: (isChecked: boolean) => void
  size?: 'medium' | 'compact'
  /** `false` removes the space above and below, for a checkbox that sits in a row of other controls. */
  hasVerticalSpace?: boolean
}

export function Checkbox({ label, description, isChecked, onChange, size = 'medium', hasVerticalSpace = true }: CheckboxProps) {
  return (
    <label className={classNames(styles.checkbox, size === 'compact' && styles.compact, !hasVerticalSpace && styles.flush)}>
      <input
        className={styles.input}
        type="checkbox"
        checked={isChecked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>
        {label}
        {description && <small className={styles.description}>{description}</small>}
      </span>
    </label>
  )
}
