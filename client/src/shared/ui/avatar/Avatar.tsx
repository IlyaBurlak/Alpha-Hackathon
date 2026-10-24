import { classNames } from '@/shared/lib'

import styles from './Avatar.module.css'

interface AvatarProps {
  initials: string
  /** Square avatars stand for companies, round ones for people. */
  shape: 'round' | 'square'
  size?: 'medium' | 'small'
}

export function Avatar({ initials, shape, size = 'medium' }: AvatarProps) {
  return (
    <span className={classNames(styles.avatar, shape === 'square' && styles.square, size === 'small' && styles.small)} aria-hidden="true">
      {initials}
    </span>
  )
}
