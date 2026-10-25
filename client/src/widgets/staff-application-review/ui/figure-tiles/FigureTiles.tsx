import { classNames } from '@/shared/lib'

import styles from './FigureTiles.module.css'

export interface FigureTile {
  label: string
  value: string
  /** A small line under the value, e.g. the limit. */
  note?: string
  tone?: 'positive' | 'attention' | 'negative'
}

interface FigureTilesProps {
  tiles: readonly FigureTile[]
}

/** Four key numbers in a row. */
export function FigureTiles({ tiles }: FigureTilesProps) {
  return (
    <div className={styles.tiles}>
      {tiles.map(({ label, value, note, tone }) => (
        <div key={label} className={styles.tile}>
          <small className={styles.label}>{label}</small>
          <b className={styles.value}>{value}</b>
          {note && <span className={classNames(styles.note, tone && styles[tone])}>{note}</span>}
        </div>
      ))}
    </div>
  )
}
