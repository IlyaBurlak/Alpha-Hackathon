import type { ReactNode } from 'react'

import styles from './ReviewSection.module.css'

interface ReviewSectionProps {
  /** The anchor of the section: the menu under the title scrolls to it. */
  id: string
  title: string
  /** Where the data comes from, at the right of the title. */
  source?: ReactNode
  /** Something at the right of the title instead of the source, e.g. the summary of the checks. */
  aside?: ReactNode
  children: ReactNode
}

/** A white box with a title: the block every part of the application page is made of. */
export function ReviewSection({ id, title, source, aside, children }: ReviewSectionProps) {
  return (
    <section className={styles.section} id={id}>
      <div className={styles.header}>
        <h2>{title}</h2>
        {source && <span className={styles.source}>{source}</span>}
        {aside}
      </div>
      {children}
    </section>
  )
}
