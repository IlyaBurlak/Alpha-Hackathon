import styles from './Switch.module.css'

interface SwitchProps {
  label: string
  isChecked: boolean
  onChange: (isChecked: boolean) => void
}

/** An on/off toggle with a text next to it. */
export function Switch({ label, isChecked, onChange }: SwitchProps) {
  return (
    <label className={styles.switch}>
      <input
        className={styles.input}
        type="checkbox"
        role="switch"
        checked={isChecked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  )
}
