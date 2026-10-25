import type { ReactNode } from 'react'

import { classNames } from '@/shared/lib'

import styles from './KeyValueList.module.css'

export interface KeyValueItem {
  label: string
  value: ReactNode
}

interface KeyValueListProps {
  items: readonly KeyValueItem[]
  isCompact?: boolean
}

export function KeyValueList({ items, isCompact = false }: KeyValueListProps) {
  return (
    <dl className={classNames(styles.list, isCompact && styles.compact)}>
      {items.map((item) => (
        <div key={item.label} className={styles.row}>
          <dt className={styles.term}>{item.label}</dt>
          <dd className={styles.value}>{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
