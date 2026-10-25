import type { ExternalServiceInfo } from '../model/types'

export const EXTERNAL_SERVICES: readonly ExternalServiceInfo[] = [
  {
    id: 'bank',
    title: 'Банк',
    description: 'Кредитные продукты банка: суммы, сроки и условия.',
  },
  {
    id: 'credit-bureau',
    title: 'Кредитное бюро',
    description: 'Кредитная история компании: займы, просрочки, банкротство.',
  },
  {
    id: 'register',
    title: 'Единый реестр',
    description: 'Госреестр: данные о юридических лицах и предпринимателях.',
  },
]
