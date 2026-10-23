import { APPLICATION_STATUSES, CREDIT_TIME_UNITS } from '../model/types'
import type { ApplicationStatus, CreditTime, CreditTimeUnit } from '../model/types'

export const CREDIT_TIME_UNIT_LABELS: Record<CreditTimeUnit, string> = {
  [CREDIT_TIME_UNITS.day]: 'дн.',
  [CREDIT_TIME_UNITS.month]: 'мес.',
  [CREDIT_TIME_UNITS.year]: 'лет',
}

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  [APPLICATION_STATUSES.draft]: 'Черновик',
  [APPLICATION_STATUSES.submitted]: 'На рассмотрении',
  [APPLICATION_STATUSES.approved]: 'Одобрена',
  [APPLICATION_STATUSES.rejected]: 'Отклонена',
}

const rubleFormat = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 })
const dateFormat = new Intl.DateTimeFormat('ru-RU')

export function formatMoney(amount: number): string {
  return rubleFormat.format(amount)
}

export function formatDate(date: Date): string {
  return dateFormat.format(date)
}

export function formatCreditTime({ value, unit }: CreditTime): string {
  return `${value} ${CREDIT_TIME_UNIT_LABELS[unit]}`
}
