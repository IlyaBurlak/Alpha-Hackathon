export const CREDIT_GOALS = [
  { id: 'working', label: 'Пополнить оборотные средства', shortLabel: 'Оборотные средства' },
  { id: 'equipment', label: 'Купить оборудование', shortLabel: 'Оборудование' },
  { id: 'transport', label: 'Купить транспорт или спецтехнику', shortLabel: 'Транспорт' },
  { id: 'expand', label: 'Открыть точку или направление', shortLabel: 'Расширение' },
  { id: 'refinance', label: 'Рефинансировать кредиты', shortLabel: 'Рефинансирование' },
  { id: 'other', label: 'Другая цель', shortLabel: 'Другая цель' },
] as const

export type CreditGoalId = (typeof CREDIT_GOALS)[number]['id']

export const LOAN_TERMS_IN_MONTHS = [6, 12, 24, 36, 48, 60] as const

export const MIN_LOAN_SUM = 100_000
export const MAX_LOAN_SUM = 50_000_000
