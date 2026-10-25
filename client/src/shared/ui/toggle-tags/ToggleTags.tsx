import { useId } from 'react'

import { FieldError } from '../form-field'
import styles from './ToggleTags.module.css'

export interface ToggleTagOption<Value extends string> {
  value: Value
  label: string
}

interface ToggleTagsProps<Value extends string> {
  options: ReadonlyArray<ToggleTagOption<Value>>
  /** The pressed option; `null` while nothing is chosen. */
  value: Value | null
  onChange: (value: Value) => void
  /** What is wrong with the choice; shown as a small hint under the tags. */
  error?: string | null
}

/** A row of mutually exclusive toggle buttons. */
export function ToggleTags<Value extends string>({ options, value, onChange, error }: ToggleTagsProps<Value>) {
  const errorId = useId()

  return (
    <div>
      <div className={styles.tags} role="group" aria-describedby={error ? errorId : undefined}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={styles.tag}
            aria-pressed={option.value === value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  )
}
