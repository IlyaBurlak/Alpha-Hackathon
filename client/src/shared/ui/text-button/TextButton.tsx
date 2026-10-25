import type { ButtonHTMLAttributes } from 'react'

import styles from './TextButton.module.css'

type TextButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'>

/** Button that looks like a link: for actions that do not navigate. */
export function TextButton({ type = 'button', ...buttonProps }: TextButtonProps) {
  return <button type={type} className={styles.button} {...buttonProps} />
}
