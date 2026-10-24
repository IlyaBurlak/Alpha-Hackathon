import { classNames } from '@/shared/lib'

import styles from './Field.module.css'

interface TextAreaFieldProps {
  label: string
  value: string
  maxLength: number
  onChange: (value: string) => void
}

export function TextAreaField({ label, value, maxLength, onChange }: TextAreaFieldProps) {
  return (
    <label className={classNames(styles.field, styles.multiline)}>
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
