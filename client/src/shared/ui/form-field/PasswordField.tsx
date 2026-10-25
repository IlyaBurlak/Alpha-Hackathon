import { useState } from 'react'

import { Icon } from '../icon'
import styles from './PasswordField.module.css'
import { TextField } from './TextField'

interface PasswordFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  isInvalid?: boolean
}

/** A password field with a button that shows the typed text for a moment. */
export function PasswordField({ label, value, onChange, isInvalid }: PasswordFieldProps) {
  const [isRevealed, setIsRevealed] = useState(false)

  return (
    <TextField
      label={label}
      value={value}
      type={isRevealed ? 'text' : 'password'}
      name="password"
      autoComplete="current-password"
      isInvalid={isInvalid}
      onChange={onChange}
      trailing={
        <button
          type="button"
          className={styles.peek}
          aria-label={isRevealed ? 'Скрыть пароль' : 'Показать пароль'}
          aria-pressed={isRevealed}
          onClick={() => setIsRevealed((current) => !current)}
        >
          <Icon name="eye" size={18} />
        </button>
      }
    />
  )
}
