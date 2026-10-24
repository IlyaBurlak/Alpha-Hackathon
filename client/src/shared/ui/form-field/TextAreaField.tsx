import { classNames } from '@/shared/lib'

import styles from './Field.module.css'

interface TextAreaFieldProps {
  label: string
  value: string
  maxLength: number
  onChange: (value: string) => void
  isInvalid?: boolean
}

export function TextAreaField({ label, value, maxLength, onChange, isInvalid }: TextAreaFieldProps) {
  return (
    <label className={classNames(styles.field, styles.multiline, isInvalid && styles.invalid)}>
      <span className={styles.label}>{label}</span>
      <textarea
        className={styles.control}
        value={value}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}
