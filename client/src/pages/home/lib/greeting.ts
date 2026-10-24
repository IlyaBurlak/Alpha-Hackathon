const NIGHT_UNTIL = 6
const MORNING_UNTIL = 12
const DAY_UNTIL = 18

export function getGreeting(hour: number): string {
  if (hour < NIGHT_UNTIL) return 'Доброй ночи'
  if (hour < MORNING_UNTIL) return 'Доброе утро'
  if (hour < DAY_UNTIL) return 'Добрый день'
  return 'Добрый вечер'
}
