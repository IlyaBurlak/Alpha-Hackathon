import { pluralize } from '@/shared/lib'

import { getTermInMonths } from '../loan/loan-calculation'
import type { CreditTime } from '../../model/types'

const NBSP = ' '
const MILLION = 1_000_000
const THOUSAND = 1000
const HUNDRED_THOUSAND_UNITS = 10_000
const CENTS = 100

const rubleFormat = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 })
const numberFormat = new Intl.NumberFormat('ru-RU')
const percentFormat = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const dateFormat = new Intl.DateTimeFormat('ru-RU')
const dayMonthFormat = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' })
const timeFormat = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' })

export function formatMoney(amount: number): string {
  return rubleFormat.format(amount)
}

/** Short money for chart labels: `2,5 млн ₽`, `300 тыс ₽`. */
export function formatMoneyShort(amount: number): string {
  if (amount >= MILLION) {
    const millions = Math.round(amount / HUNDRED_THOUSAND_UNITS) / CENTS
    return `${numberFormat.format(millions)}${NBSP}млн${NBSP}₽`
  }
  return `${numberFormat.format(Math.round(amount / THOUSAND))}${NBSP}тыс${NBSP}₽`
}

/** Digits grouped by thousands, for amount inputs. */
export function formatNumber(value: number): string {
  return numberFormat.format(value)
}

export function formatPercent(value: number): string {
  return `${percentFormat.format(value)}%`
}

export function formatDate(date: Date): string {
  return dateFormat.format(date)
}

/** `12 мая 2026`: the Russian long date without the "г." that `Intl` adds. */
export function formatLongDate(date: Date): string {
  return `${dayMonthFormat.format(date).replace(' ', NBSP)} ${date.getFullYear()}`
}

/** `сегодня, 14:05` for today, otherwise the long date. */
export function formatWhen(date: Date, now: Date = new Date()): string {
  return date.toDateString() === now.toDateString() ? `сегодня, ${timeFormat.format(date)}` : formatLongDate(date)
}

export function formatMonths(months: number): string {
  return `${months}${NBSP}${pluralize(months, ['месяц', 'месяца', 'месяцев'])}`
}

/** The term in months whatever unit the backend used. */
export function formatCreditTime(creditTime: CreditTime): string {
  return formatMonths(getTermInMonths(creditTime))
}
