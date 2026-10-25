import { classNames } from '@/shared/lib'

import styles from './Segmented.module.css'

export interface SegmentedOption<Value extends string> {
  value: Value
  label: string
  /** A number shown after the label, e.g. how many items the tab holds. */
  count?: number
}

interface SegmentedProps<Value extends string> {
  options: ReadonlyArray<SegmentedOption<Value>>
  value: Value
  onChange: (value: Value) => void
  ariaLabel: string
  size?: 'medium' | 'compact'
}

/** Tab-like switch between views of the same data. */
export function Segmented<Value extends string>({ options, value, onChange, ariaLabel, size = 'medium' }: SegmentedProps<Value>) {
  return (
    <div className={classNames(styles.segmented, size === 'compact' && styles.compact)} role="tablist" aria-label={ariaLabel}>
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
          {option.count !== undefined && <span className={styles.count}>{option.count}</span>}
        </button>
      ))}
    </div>
  )
}
