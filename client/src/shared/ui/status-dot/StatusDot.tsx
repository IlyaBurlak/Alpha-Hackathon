import type { ReactNode } from 'react'

import { classNames } from '@/shared/lib'

import styles from './StatusDot.module.css'

export type StatusTone = 'default' | 'neutral' | 'info' | 'positive' | 'attention' | 'negative'

interface StatusDotProps {
  tone: StatusTone
  /** Smaller text, for dense tables. */
  size?: 'medium' | 'small'
  /** The dot blinks: something is still being calculated. */
  isBlinking?: boolean
  children: ReactNode
}

export function StatusDot({ tone, size = 'medium', isBlinking = false, children }: StatusDotProps) {
  return (
    <span className={classNames(styles.dot, styles[tone], size === 'small' && styles.small, isBlinking && styles.blinking)}>
      {children}
    </span>
  )
}
