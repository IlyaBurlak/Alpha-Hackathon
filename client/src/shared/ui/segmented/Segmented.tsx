import styles from './Segmented.module.css'

export interface SegmentedOption<Value extends string> {
  value: Value
  label: string
}

interface SegmentedProps<Value extends string> {
  options: ReadonlyArray<SegmentedOption<Value>>
  value: Value
  onChange: (value: Value) => void
  ariaLabel: string
}

/** Tab-like switch between views of the same data. */
export function Segmented<Value extends string>({ options, value, onChange, ariaLabel }: SegmentedProps<Value>) {
  return (
    <div className={styles.segmented} role="tablist" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          className={styles.option}
          aria-selected={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
