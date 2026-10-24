import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import styles from './Toast.module.css'
import { ToastContext } from './toast-context'

const TOAST_LIFETIME_MS = 3000

interface Toast {
  id: number
  text: string
}

interface ToastProviderProps {
  children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)
  const timers = useRef(new Set<number>())

  useEffect(() => {
    const pendingTimers = timers.current
    return () => pendingTimers.forEach((timer) => window.clearTimeout(timer))
  }, [])

  const showToast = (text: string) => {
    const id = nextId.current
    nextId.current += 1
    setToasts((current) => [...current, { id, text }])
    const timer = window.setTimeout(() => {
      timers.current.delete(timer)
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, TOAST_LIFETIME_MS)
    timers.current.add(timer)
  }

  return (
    <ToastContext value={showToast}>
      {children}
      <div className={styles.toasts} role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={styles.toast}>
            {toast.text}
          </div>
        ))}
      </div>
    </ToastContext>
  )
}
