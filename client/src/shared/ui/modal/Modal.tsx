import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'

import styles from './Modal.module.css'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
  /** Buttons at the bottom; the first focusable element of the dialog gets the focus when it opens. */
  actions: ReactNode
}

const FOCUSABLE_SELECTOR = 'button:not([disabled]):not([tabindex="-1"]), input:not([disabled]), a[href], select, textarea'

export function Modal({ title, onClose, children, actions }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus()
    return () => opener?.focus()
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      // Keep Tab inside the dialog: the page behind it is not reachable while it is open.
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <>
      <button type="button" className={styles.scrim} aria-label="Закрыть" tabIndex={-1} onClick={onClose} />
      <div ref={dialogRef} className={styles.modal} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <h2 id={titleId} className={styles.title}>{title}</h2>
        {children}
        <div className={styles.actions}>{actions}</div>
      </div>
    </>
  )
}
