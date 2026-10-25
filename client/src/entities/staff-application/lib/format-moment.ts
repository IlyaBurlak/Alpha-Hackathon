import { formatLongDate } from '@/shared/lib'

const MS_IN_DAY = 86_400_000
const timeFormat = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' })

/** `сегодня, 14:05`, `вчера, 09:30`, `12 мая 2026, 10:20`. */
export function formatMoment(date: Date, now: Date = new Date()): string {
  const time = timeFormat.format(date)
  if (date.toDateString() === now.toDateString()) return `сегодня, ${time}`
  if (date.toDateString() === new Date(now.getTime() - MS_IN_DAY).toDateString()) return `вчера, ${time}`
  return `${formatLongDate(date)}, ${time}`
}
