const TEN = 10
const HUNDRED = 100
const FIRST_TEEN = 11
const LAST_TEEN = 19
const FEW_FROM = 2
const FEW_TO = 4

/** Picks the Russian noun form for a count: `[1 месяц, 2 месяца, 5 месяцев]`. */
export function pluralize(count: number, forms: readonly [one: string, few: string, many: string]): string {
  const lastTwoDigits = Math.abs(count) % HUNDRED
  const lastDigit = lastTwoDigits % TEN
  if (lastTwoDigits >= FIRST_TEEN && lastTwoDigits <= LAST_TEEN) return forms[2]
  if (lastDigit >= FEW_FROM && lastDigit <= FEW_TO) return forms[1]
  if (lastDigit === 1) return forms[0]
  return forms[2]
}
