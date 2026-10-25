import { classNames } from '@/shared/lib'

import type { VariantTone } from '../../../lib/comparison'

import styles from './VariantSwatch.module.css'

interface VariantSwatchProps {
  /** The variant the colour stands for; `neutral` is for legends that are not about a variant. */
  tone: VariantTone | 'neutral'
  /** A paler square, for the "interest" part of a payout bar. */
  isFaded?: boolean
  className?: string
}

/** The small coloured square that marks a variant in legends, tables and tooltips. */
export function VariantSwatch({ tone, isFaded = false, className }: VariantSwatchProps) {
  return <i className={classNames(styles.swatch, styles[tone], isFaded && styles.faded, className)} />
}
