import { CREDIT_GOALS } from '../../config/loan-form'
import type { Application } from '../../model/types'

const UNKNOWN_GOAL_TITLE = 'Новая заявка'

/** The chosen product once there is one, otherwise the goal of the loan. */
export function getApplicationTitle({ productChoice, goal }: Application): string {
  if (productChoice.kind === 'selected') return productChoice.product.name
  return CREDIT_GOALS.find(({ id }) => id === goal)?.shortLabel ?? UNKNOWN_GOAL_TITLE
}
