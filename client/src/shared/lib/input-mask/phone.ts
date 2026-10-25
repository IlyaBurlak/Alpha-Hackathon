const NOT_DIGIT_PATTERN = /\D/g
const COUNTRY_CODE = '+7'
const NATIONAL_NUMBER_LENGTH = 10
/** Both "7" and "8" start a Russian number: the first one is the country code, not a digit of the number. */
const COUNTRY_CODE_DIGITS = ['7', '8']

/** Digits of the number without the country code; at most ten. */
function getNationalDigits(input: string): string {
  const digits = input.replace(NOT_DIGIT_PATTERN, '')
  const withoutCode = COUNTRY_CODE_DIGITS.includes(digits[0]) ? digits.slice(1) : digits
  return withoutCode.slice(0, NATIONAL_NUMBER_LENGTH)
}

/**
 * Formats what the user typed or pasted as `+7 916 482-17-35`, as far as the digits go.
 * An empty input stays empty, so the field shows its placeholder and the prefix goes away with the last digit.
 */
export function formatPhone(input: string): string {
  const national = getNationalDigits(input)
  if (national === '') {
    // A lone "7" or "8" typed into an empty field is the start of the country code; once the prefix is on screen
    // (`+`), removing the last digit clears the field.
    const hasOnlyCountryCode = input.replace(NOT_DIGIT_PATTERN, '') !== '' && !input.includes('+')
    return hasOnlyCountryCode ? COUNTRY_CODE : ''
  }
  let result = `${COUNTRY_CODE} ${national.slice(0, 3)}`
  if (national.length > 3) result += ` ${national.slice(3, 6)}`
  if (national.length > 6) result += `-${national.slice(6, 8)}`
  if (national.length > 8) result += `-${national.slice(8, 10)}`
  return result
}

export function isCompletePhone(input: string): boolean {
  return getNationalDigits(input).length === NATIONAL_NUMBER_LENGTH
}
