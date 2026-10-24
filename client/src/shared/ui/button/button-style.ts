import { classNames } from '@/shared/lib'

import styles from './Button.module.css'

export type ButtonView = 'primary' | 'accent' | 'secondary' | 'ghost'
export type ButtonSize = 'small' | 'medium' | 'large'

export interface ButtonStyle {
  view?: ButtonView
  size?: ButtonSize
  isBlock?: boolean
}

/** Class names of a button, for links that must look like one (`<Link className={getButtonClassName(...)}>`). */
export function getButtonClassName({ view = 'primary', size = 'medium', isBlock = false }: ButtonStyle = {}): string {
  return classNames(styles.button, styles[view], size !== 'medium' && styles[size], isBlock && styles.block)
}
