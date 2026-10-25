import { pluralize } from '../text/plural'

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

const NOT_DIGIT_PATTERN = /\D/g
/** More digits than a sum of money needs, and still exact as a number. */
const MAX_DIGITS_IN_AMOUNT = 12

const THOUSANDS_BOUNDARY_PATTERN = /\B(?=(\d{3})+(?!\d))/g

/**
 * Digits of a typed text grouped by thousands (`2500` -> `2 500`); anything else is dropped, the length is capped.
 * Zeros in front stay (`000 000`): removing the first digit of `3 000 000` must not wipe out the rest while the user
 * is still typing; `normalizeDigits` cleans them when the user leaves the field.
 */
export function groupDigits(text: string, maxDigits: number = MAX_DIGITS_IN_AMOUNT): string {
  return text.replace(NOT_DIGIT_PATTERN, '').slice(0, maxDigits).replace(THOUSANDS_BOUNDARY_PATTERN, NBSP)
}

/** The grouped digits without zeros in front (`000 500` -> `500`); an empty text stays empty. */
export function normalizeDigits(text: string): string {
  return groupDigits(text) === '' ? '' : formatNumber(parseDigits(text))
}

/** Grouped digits as typed (`2 500 000`) to a number; empty or garbage gives 0. */
export function parseDigits(text: string): number {
  return Number(text.replace(NOT_DIGIT_PATTERN, '').slice(0, MAX_DIGITS_IN_AMOUNT))
}
