import styles from './Field.module.css'

interface FieldErrorProps {
  id: string
  children: string
}

/** A small hint under a field that did not pass the check; announced politely, not as an alert. */
export function FieldError({ id, children }: FieldErrorProps) {
  return (
    <p id={id} className={styles.error} aria-live="polite">
      {children}
    </p>
  )
}
