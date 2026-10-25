import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

import styles from './Modal.module.css'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
  /** Buttons at the bottom; the first focusable element of the dialog gets the focus when it opens. */
  actions: ReactNode
}

export function Modal({ title, onClose, children, actions }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    dialogRef.current?.querySelector<HTMLElement>('button, input')?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <>
      <button type="button" className={styles.scrim} aria-label="Закрыть" tabIndex={-1} onClick={onClose} />
      <div ref={dialogRef} className={styles.modal} role="dialog" aria-modal="true" aria-label={title}>
        <h2 className={styles.title}>{title}</h2>
        {children}
        <div className={styles.actions}>{actions}</div>
      </div>
    </>
  )
}
