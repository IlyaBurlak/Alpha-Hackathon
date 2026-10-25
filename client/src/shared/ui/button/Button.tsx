import type { ButtonHTMLAttributes } from 'react'

import { getButtonClassName } from './button-style'
import type { ButtonStyle } from './button-style'

interface ButtonProps extends ButtonStyle, Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {}

export function Button({ view, size, isBlock, type = 'button', ...buttonProps }: ButtonProps) {
  return <button type={type} className={getButtonClassName({ view, size, isBlock })} {...buttonProps} />
}
