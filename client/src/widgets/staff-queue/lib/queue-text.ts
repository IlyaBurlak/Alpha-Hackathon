import type { QueueMode } from '@/entities/staff-application'

const NBSP = ' '

export const QUEUE_TITLES: Record<QueueMode, { title: string; subtitle: string }> = {
  queue: { title: 'Очередь заявок', subtitle: 'Заявки малого бизнеса, поступившие из кредитного кабинета' },
  mine: { title: 'Мои заявки', subtitle: 'Заявки, где вы ответственный' },
  done: { title: 'Решённые', subtitle: 'Одобренные и отклонённые заявки' },
}

/** `Дмитрий Орлов` -> `Д. Орлов`, as short as the table cell allows. */
export function shortenName(fullName: string): string {
  const [first = '', second = ''] = fullName.split(' ')
  return second ? `${first[0]}.${NBSP}${second}` : first
}
