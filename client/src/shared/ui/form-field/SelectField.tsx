import { classNames } from '@/shared/lib'

import styles from './Field.module.css'
import { Icon } from '../icon'

export interface SelectOption {
  value: string
  label: string
}

interface SelectFieldProps {
  label: string
  /** An empty string means "nothing chosen yet". */
  value: string
  options: readonly SelectOption[]
  onChange: (value: string) => void
  /** For fields on a tinted panel: the field stays white. */
  isOnSurface?: boolean
  className?: string
}

export function SelectField({ label, value, options, onChange, isOnSurface, className }: SelectFieldProps) {
  return (
    <label className={classNames(styles.field, isOnSurface && styles.onSurface, className)}>
      <span className={styles.label}>{label}</span>
      <select className={classNames(styles.control, styles.select)} value={value} onChange={(event) => onChange(event.target.value)}>
        {value === '' && <option value="" disabled hidden />}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span className={styles.chevron}>
        <Icon name="down" size={20} />
      </span>
    </label>
  )
}
