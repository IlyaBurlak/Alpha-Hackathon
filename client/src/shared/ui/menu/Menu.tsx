import type { ReactNode } from 'react'

import { classNames } from '@/shared/lib'

import styles from './Menu.module.css'

interface MenuItemProps {
  title: string
  description?: string
  /** Avatar or icon before the text. */
  leading?: ReactNode
  /** Mark after the text, e.g. a check for the current choice. */
  trailing?: ReactNode
  /** Without a handler the item is a plain, non-interactive row. */
  onClick?: () => void
  size?: 'medium' | 'compact'
}

export function MenuItem({ title, description, leading, trailing, onClick, size = 'medium' }: MenuItemProps) {
  const itemClassName = classNames(styles.item, size === 'compact' && styles.compactItem)
  const content = (
    <>
      {leading}
      <span className={styles.text}>
        <b className={styles.title}>{title}</b>
        {description && <small className={styles.description}>{description}</small>}
      </span>
      {trailing}
    </>
  )

  if (!onClick) return <div className={itemClassName}>{content}</div>

  return (
    <button type="button" role="menuitem" className={itemClassName} onClick={onClick}>
      {content}
    </button>
  )
}

interface MenuHeadingProps {
  children: ReactNode
}

export function MenuHeading({ children }: MenuHeadingProps) {
  return <p className={styles.heading}>{children}</p>
}

export function MenuDivider() {
  return <hr className={styles.divider} />
}
