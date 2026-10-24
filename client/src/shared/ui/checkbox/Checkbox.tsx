import styles from './Checkbox.module.css'

interface CheckboxProps {
  label: string
  description?: string
  isChecked: boolean
  onChange: (isChecked: boolean) => void
}

export function Checkbox({ label, description, isChecked, onChange }: CheckboxProps) {
  return (
    <label className={styles.checkbox}>
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
