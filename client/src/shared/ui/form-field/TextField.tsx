import { useId } from 'react'
import type { ChangeEvent, HTMLAttributes, ReactNode } from 'react'

import { classNames, countDigits, findCaretWithDigitsAfter } from '@/shared/lib'

import { FieldError } from './FieldError'
import styles from './Field.module.css'

interface TextFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  /** Unit shown at the right edge, e.g. `₽`. */
  suffix?: string
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode']
  autoComplete?: string
  type?: 'text' | 'password'
  /** An accessible name for inputs whose label is not enough for password managers and tests. */
  name?: string
  /** A control inside the field at the right edge, e.g. the "show password" button. */
  trailing?: ReactNode
  placeholder?: string
  /**
   * The parent regroups the digits as the user types (`2 500 000`, `+7 916 …`): the caret is then kept
   * in front of the same digits instead of jumping to the end.
   */
  hasDigitMask?: boolean
  /** What is wrong with the value; the field gets a red border and the text appears under it. */
  error?: string | null
  /** The border turns red without a hint under the field: the message is shown elsewhere. */
  isInvalid?: boolean
  /** For fields on a tinted panel: the field stays white. */
  isOnSurface?: boolean
  className?: string
}

export function TextField({
  label,
  value,
  onChange,
  onBlur,
  suffix,
  inputMode,
  autoComplete = 'off',
  type = 'text',
  name,
  trailing,
  placeholder,
  hasDigitMask,
  error,
  isInvalid,
  isOnSurface,
  className,
}: TextFieldProps) {
  const errorId = useId()
  const hasProblem = Boolean(error) || isInvalid === true

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target
    const digitsAfterCaret = hasDigitMask ? countDigits(input.value.slice(input.selectionStart ?? input.value.length)) : null
    onChange(input.value)
    if (digitsAfterCaret === null) return
    // React puts the regrouped value back after the event, which moves the caret to the end.
    queueMicrotask(() => {
      const caret = findCaretWithDigitsAfter(input.value, digitsAfterCaret)
      input.setSelectionRange(caret, caret)
    })
  }

  return (
    <div className={classNames(styles.wrapper, className)}>
      <label className={classNames(styles.field, hasProblem && styles.invalid, isOnSurface && styles.onSurface)}>
        <span className={styles.label}>{label}</span>
        <input
          className={styles.control}
          type={type}
          name={name}
          value={value}
          inputMode={inputMode}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={hasProblem ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={handleChange}
          onBlur={onBlur}
        />
        {suffix && <span className={styles.suffix}>{suffix}</span>}
      </label>
      {trailing && <span className={styles.trailing}>{trailing}</span>}
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  )
}
