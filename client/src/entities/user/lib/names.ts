import { ORGANIZATION_TYPES } from '../model/types'
import type { OrganizationType } from '../model/types'

const INITIALS_LENGTH = 2
const LEGAL_FORM_PATTERN = /^(ООО|ИП|АО|ПАО|ЗАО)$/i
const QUOTES_PATTERN = /["«»'“”]/g

export const ORGANIZATION_TYPE_LABELS: Record<OrganizationType, string> = {
  [ORGANIZATION_TYPES.legalEntity]: 'Юридическое лицо',
  [ORGANIZATION_TYPES.soleProprietor]: 'Индивидуальный предприниматель',
}

function splitWords(text: string): string[] {
  return text.split(/\s+/).filter(Boolean)
}

/** Two letters for a company avatar: `ООО "Кот не знает"` -> `КН`, `ИП Сырный Иван` -> `СИ`. */
export function getOrganizationInitials(name: string): string {
  const words = splitWords(name.replace(QUOTES_PATTERN, ' ')).filter((word) => !LEGAL_FORM_PATTERN.test(word))
  const meaningfulWords = words.filter((word) => word.length > 1)
  const source = meaningfulWords.length >= INITIALS_LENGTH ? meaningfulWords.map((word) => word[0]).join('') : (meaningfulWords[0] ?? name)
  return source.slice(0, INITIALS_LENGTH).toUpperCase()
}

/** Initials of a person from the full name: `Бурлак Илья` -> `БИ`. */
export function getPersonInitials(fullName: string): string {
  return splitWords(fullName)
    .slice(0, INITIALS_LENGTH)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

/** Bank names come as "Surname Name": the greeting uses the second word, or the only one there is. */
export function getFirstName(fullName: string): string {
  const [surname = '', name] = splitWords(fullName)
  return name ?? surname
}
