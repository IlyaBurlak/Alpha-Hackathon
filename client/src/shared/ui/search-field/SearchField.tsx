import { useEffect, useRef } from 'react'

import { Icon } from '../icon'
import styles from './SearchField.module.css'

const FOCUS_KEY = '/'
const TYPING_TAGS = ['INPUT', 'TEXTAREA', 'SELECT']

interface SearchFieldProps {
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
}

/** A search box; pressing "/" anywhere on the page puts the cursor into it. */
export function SearchField({ label, placeholder, value, onChange }: SearchFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isTyping = TYPING_TAGS.includes(document.activeElement?.tagName ?? '')
      if (event.key !== FOCUS_KEY || isTyping) return
      event.preventDefault()
      inputRef.current?.focus()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <label className={styles.search}>
      <Icon name="search" size={18} />
      <span className={styles.label}>{label}</span>
      <input
        ref={inputRef}
        className={styles.input}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}
