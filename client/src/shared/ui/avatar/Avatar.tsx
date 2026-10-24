import { classNames } from '@/shared/lib'

import styles from './Avatar.module.css'

interface AvatarProps {
  initials: string
  /** Square avatars stand for companies, round ones for people. */
  shape: 'round' | 'square'
}

export function Avatar({ initials, shape }: AvatarProps) {
  return (
    <span className={classNames(styles.avatar, shape === 'square' && styles.square)} aria-hidden="true">
      {initials}
    </span>
  )
}
