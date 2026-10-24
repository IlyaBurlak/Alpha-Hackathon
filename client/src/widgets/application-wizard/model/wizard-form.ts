import { formatPhone, isRecord } from '@/shared/lib'

export const APPLICANT_ROLES = [
  'Генеральный директор',
  'Собственник',
  'Финансовый директор',
  'Бухгалтер',
  'Сотрудник по доверенности',
] as const
export type ApplicantRole = (typeof APPLICANT_ROLES)[number]

export const POWER_OF_ATTORNEY_ROLE: ApplicantRole = 'Сотрудник по доверенности'

export const COLLATERAL_TYPES = ['Недвижимость', 'Транспорт', 'Оборудование'] as const
export type CollateralType = (typeof COLLATERAL_TYPES)[number]

export const COLLATERAL_OWNERS = ['Компания', 'Руководитель', 'Третье лицо'] as const
export type CollateralOwner = (typeof COLLATERAL_OWNERS)[number]

export const CONSENTS = [
  { key: 'personalData', title: 'Согласие на обработку персональных данных', description: 'Нужно для рассмотрения заявки' },
  {
    key: 'creditBureau',
    title: 'Согласие на запрос в бюро кредитных историй',
    description: 'Банк проверит кредиты и платёжную дисциплину',
  },
  {
    key: 'fiscalData',
    title: 'Согласие на получение данных от операторов фискальных данных',
    description: 'Поможет точнее оценить выручку',
  },
] as const
export type ConsentKey = (typeof CONSENTS)[number]['key']

export type OtherLoansAnswer = 'yes' | 'no'

/** Everything the user fills in after choosing a variant. Numbers are kept as grouped digit strings, as typed. */
export interface WizardForm {
  role: ApplicantRole
  phone: string
  email: string
  revenue: string
  employees: string
  otherLoans: OtherLoansAnswer | null
  otherLoanPayments: string
  collateralType: CollateralType | null
  collateralValue: string
  collateralOwner: CollateralOwner
  note: string
  consents: Record<ConsentKey, boolean>
}

export type DigitsField = 'revenue' | 'employees' | 'otherLoanPayments' | 'collateralValue'

export const NOTE_MAX_LENGTH = 200

/** What is known about the applicant before they fill anything in. */
export interface WizardDefaults {
  role: string | null
  phone: string | null
  email: string | null
  revenue: number | null
  employees: number | null
}

const EMPTY_DEFAULTS: WizardDefaults = { role: null, phone: null, email: null, revenue: null, employees: null }

function formatPrefill(value: number | null): string {
  return value === null || value <= 0 ? '' : new Intl.NumberFormat('ru-RU').format(value)
}

export function createInitialForm(defaults: WizardDefaults = EMPTY_DEFAULTS): WizardForm {
  return {
    role: APPLICANT_ROLES.find((role) => role === defaults.role) ?? APPLICANT_ROLES[0],
    phone: formatPhone(defaults.phone ?? ''),
    email: defaults.email ?? '',
    revenue: formatPrefill(defaults.revenue),
    employees: formatPrefill(defaults.employees),
    otherLoans: null,
    otherLoanPayments: '',
    collateralType: null,
    collateralValue: '',
    collateralOwner: COLLATERAL_OWNERS[0],
    note: '',
    consents: { personalData: false, creditBureau: false, fiscalData: false },
  }
}

function isOneOf<Value extends string>(options: readonly Value[], value: unknown): value is Value {
  return options.some((option) => option === value)
}

function readConsents(value: unknown): Record<ConsentKey, boolean> | null {
  if (
    !isRecord(value) ||
    typeof value.personalData !== 'boolean' ||
    typeof value.creditBureau !== 'boolean' ||
    typeof value.fiscalData !== 'boolean'
  ) {
    return null
  }
  return { personalData: value.personalData, creditBureau: value.creditBureau, fiscalData: value.fiscalData }
}

/** Restores a saved form; a record that does not fit the current shape is dropped as a whole. */
export function parseForm(value: unknown): WizardForm | null {
  if (!isRecord(value)) return null
  const consents = readConsents(value.consents)
  const { role, collateralType, collateralOwner, otherLoans } = value
  if (
    consents === null ||
    !isOneOf(APPLICANT_ROLES, role) ||
    !isOneOf(COLLATERAL_OWNERS, collateralOwner) ||
    !(collateralType === null || isOneOf(COLLATERAL_TYPES, collateralType)) ||
    !(otherLoans === null || otherLoans === 'yes' || otherLoans === 'no') ||
    typeof value.phone !== 'string' ||
    typeof value.email !== 'string' ||
    typeof value.revenue !== 'string' ||
    typeof value.employees !== 'string' ||
    typeof value.otherLoanPayments !== 'string' ||
    typeof value.collateralValue !== 'string' ||
    typeof value.note !== 'string'
  ) {
    return null
  }
  return {
    role,
    phone: value.phone,
    email: value.email,
    revenue: value.revenue,
    employees: value.employees,
    otherLoans,
    otherLoanPayments: value.otherLoanPayments,
    collateralType,
    collateralValue: value.collateralValue,
    collateralOwner,
    note: value.note,
    consents,
  }
}
