import type { ReactNode } from 'react'

import { classNames } from '@/shared/lib'

import styles from './Badge.module.css'

interface BadgeProps {
  tone: 'positive' | 'dark'
  children: ReactNode
}

export function Badge({ tone, children }: BadgeProps) {
  return <span className={classNames(styles.badge, styles[tone])}>{children}</span>
}
