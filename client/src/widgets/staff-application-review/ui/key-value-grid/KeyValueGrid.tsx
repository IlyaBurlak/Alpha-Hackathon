import type { ReactNode } from 'react'

import styles from './KeyValueGrid.module.css'

export interface GridItem {
  label: string
  value: ReactNode
}

interface KeyValueGridProps {
  items: readonly GridItem[]
}

/** Facts in two columns on a wide screen, one on a narrow one. */
export function KeyValueGrid({ items }: KeyValueGridProps) {
  return (
    <dl className={styles.grid}>
      {items.map(({ label, value }) => (
        <div key={label} className={styles.row}>
          <dt className={styles.term}>{label}</dt>
          <dd className={styles.value}>{value}</dd>
        </div>
      ))}
    </dl>
  )
}
