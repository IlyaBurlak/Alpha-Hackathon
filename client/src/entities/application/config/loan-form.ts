export const CREDIT_GOALS = [
  {
    id: 'working',
    label: 'Пополнить оборотные средства',
    shortLabel: 'Оборотные средства',
    apiType: 'Пополнить оборотные средства',
  },
  {
    id: 'equipment',
    label: 'Купить оборудование',
    shortLabel: 'Оборудование',
    apiType: 'спецтехника',
  },
  {
    id: 'transport',
    label: 'Купить транспорт или спецтехнику',
    shortLabel: 'Транспорт',
    apiType: 'транспорт',
  },
  {
    id: 'expand',
    label: 'Открыть точку или направление',
    shortLabel: 'Расширение',
    apiType: 'открыть новую точку',
  },
  {
    id: 'refinance',
    label: 'Рефинансировать кредиты',
    shortLabel: 'Рефинансирование',
    apiType: 'рефинансировать кредиты',
  },
  {
    id: 'other',
    label: 'Другая цель',
    shortLabel: 'Другая цель',
    apiType: 'другое',
  },
] as const

export type CreditGoalId = (typeof CREDIT_GOALS)[number]['id']

/** Maps the `type` of the backend (`ApplicationType`) to the goal id; unknown values give `null`. */
export function creditGoalFromApiType(apiType: unknown): CreditGoalId | null {
  return CREDIT_GOALS.find((goal) => goal.apiType === apiType)?.id ?? null
}

export const LOAN_TERMS_IN_MONTHS = [6, 12, 24, 36, 48, 60] as const

export const MIN_LOAN_SUM = 100_000
export const MAX_LOAN_SUM = 50_000_000
