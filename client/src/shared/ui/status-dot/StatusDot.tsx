import type { ReactNode } from 'react'

import { classNames } from '@/shared/lib'

import styles from './StatusDot.module.css'

export type StatusTone = 'default' | 'neutral' | 'info' | 'positive' | 'negative'

interface StatusDotProps {
  tone: StatusTone
  children: ReactNode
}

export function StatusDot({ tone, children }: StatusDotProps) {
  return <span className={classNames(styles.dot, styles[tone])}>{children}</span>
}
