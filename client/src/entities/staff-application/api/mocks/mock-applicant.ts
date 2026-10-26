/**
 * MOCK: the backend sends an operator neither the purpose of the loan, nor the position, phone and email of the
 * applicant, nor the collateral (the applicant questionnaire is not sent to the server yet). They are made up from
 * the application id and the INN, so one application always shows the same person. Replace with the backend data.
 */
const GOALS = [
  'Покупка оборудования',
  'Пополнение оборотных средств',
  'Открытие новой точки',
  'Закупка товара',
  'Покупка транспорта',
  'Ремонт и обновление помещения',
]
const ROLES = ['Генеральный директор', 'Собственник', 'Финансовый директор']
const SOLE_PROPRIETOR_ROLE = 'Индивидуальный предприниматель'
const FALLBACK_APPLICANTS = ['Громов Андрей Павлович', 'Назарова Мария Викторовна', 'Фёдоров Дмитрий Алексеевич', 'Крылова Ирина Сергеевна']
const EMAIL_DOMAINS = ['mail.ru', 'yandex.ru', 'gmail.com']
const COLLATERAL_TYPES = ['Недвижимость', 'Оборудование', 'Транспорт']
const COLLATERAL_COVERAGE = 1.4
const PHONE_DIGITS = 7

interface MockApplicantInput {
  applicationId: number
  inn: string
  /** The head of the register, when the register answered; the applicant is the head. */
  head: string | null
  isSoleProprietor: boolean
  isSecured: boolean
  amount: number
}

function pick<T>(items: readonly T[], seed: number): T {
  return items[seed % items.length]
}

function digitsOf(seed: number, length: number): string {
  return String(seed * 7_919 + 1_000_003)
    .padStart(length, '0')
    .slice(-length)
}

/** Latin letters of the family name for the email; the Cyrillic name would not make an address. */
function toLatin(word: string): string {
  const map: Record<string, string> = {
    а: 'a',
    б: 'b',
    в: 'v',
    г: 'g',
    д: 'd',
    е: 'e',
    ё: 'e',
    ж: 'zh',
    з: 'z',
    и: 'i',
    й: 'y',
    к: 'k',
    л: 'l',
    м: 'm',
    н: 'n',
    о: 'o',
    п: 'p',
    р: 'r',
    с: 's',
    т: 't',
    у: 'u',
    ф: 'f',
    х: 'h',
    ц: 'c',
    ч: 'ch',
    ш: 'sh',
    щ: 'sch',
    ъ: '',
    ы: 'y',
    ь: '',
    э: 'e',
    ю: 'yu',
    я: 'ya',
  }
  return [...word.toLowerCase()].map((letter) => map[letter] ?? letter).join('')
}

export function buildMockApplicant({ applicationId, inn, head, isSoleProprietor, isSecured, amount }: MockApplicantInput) {
  const seed = applicationId + Number(inn.slice(-4).replace(/\D/g, '') || 0)
  const name = head ?? pick(FALLBACK_APPLICANTS, seed)
  const [family = 'ivanov', first = 'i'] = name.split(' ')
  const phone = digitsOf(seed, PHONE_DIGITS)
  return {
    goal: pick(GOALS, seed),
    applicant: {
      name,
      role: isSoleProprietor ? SOLE_PROPRIETOR_ROLE : pick(ROLES, seed),
      phone: `+7 9${phone.slice(0, 2)} ${phone.slice(2, 5)}-${phone.slice(5, 7)}-${digitsOf(seed + 1, 2)}`,
      email: `${toLatin(first).slice(0, 1)}.${toLatin(family)}@${pick(EMAIL_DOMAINS, seed)}`,
    },
    collateral: isSecured
      ? {
          type: pick(COLLATERAL_TYPES, seed),
          value: Math.round((amount * COLLATERAL_COVERAGE) / 1_000) * 1_000,
          owner: isSoleProprietor ? 'Заявитель' : 'Компания',
        }
      : null,
  }
}
