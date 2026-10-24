/**
 * MOCK: the backend does not return company requisites, the role of the user, revenue, phone and e-mail yet.
 * The values below stand in for them; delete this file and the calls in `user-mapper.ts` once the backend sends
 * the fields (see docs/frontend-mocks.md and docs/backend-requirements.md, items 2.4.x).
 */
import type { OrganizationProfile, OrganizationType } from '../../model/types'
import { ORGANIZATION_TYPES } from '../../model/types'

const EMPTY_PROFILE: OrganizationProfile = {
  kpp: null,
  ogrn: null,
  head: null,
  address: null,
  account: null,
  role: null,
  annualRevenue: null,
  employeesCount: null,
}

/** Requisites follow the external-systems mock register; revenue is invented. */
const PROFILES_BY_INN: Record<string, OrganizationProfile> = {
  '7701234568': {
    kpp: '770101001',
    ogrn: '1234567890123',
    head: 'Подсолнухов Роман Иванович',
    address: 'г. Москва, ул. Ленина, д. 1',
    account: '4018****23',
    role: 'Генеральный директор',
    annualRevenue: 48_600_000,
    employeesCount: 10,
  },
  '5001234569': {
    kpp: '500101001',
    ogrn: '1234567890124',
    head: 'Василенко Анжелика',
    address: 'г. Санкт-Петербург, ул. Ленина, д. 2',
    account: '4015****23',
    role: 'Генеральный директор',
    annualRevenue: 32_000_000,
    employeesCount: 24,
  },
  '7801234562': {
    kpp: '780101001',
    ogrn: '1234567890125',
    head: 'Франсина Бернетт',
    address: 'г. Новосибирск, ул. Ленина, д. 3',
    account: '4018****24',
    role: 'Финансовый директор',
    annualRevenue: 7_200_000,
    employeesCount: 6,
  },
  '6601234564': {
    kpp: '660101001',
    ogrn: '1234567890126',
    head: 'Иванова Алина Сергеевна',
    address: 'г. Екатеринбург, ул. Ленина, д. 4',
    account: '4018****25',
    role: 'Генеральный директор',
    annualRevenue: 126_000_000,
    employeesCount: 459,
  },
  '2301234560': {
    kpp: null,
    ogrn: '1234567890127',
    head: 'Сырный Иван',
    address: 'г. Краснодар, ул. Красная, д. 5',
    account: '4018****22',
    role: 'Собственник',
    annualRevenue: 6_000_000,
    employeesCount: 1,
  },
  '5401234563': {
    kpp: null,
    ogrn: '1234567890128',
    head: 'Динозавриков Сергей',
    address: 'г. Новосибирск, ул. Советская, д. 7',
    account: '4018****23',
    role: 'Собственник',
    annualRevenue: 9_000_000,
    employeesCount: 3,
  },
}

const DEFAULT_ROLES: Record<OrganizationType, string> = {
  [ORGANIZATION_TYPES.legalEntity]: 'Генеральный директор',
  [ORGANIZATION_TYPES.soleProprietor]: 'Собственник',
}

export function getMockOrganizationProfile(inn: string, type: OrganizationType): OrganizationProfile {
  return PROFILES_BY_INN[inn] ?? { ...EMPTY_PROFILE, role: DEFAULT_ROLES[type] }
}

export interface UserContacts {
  phone: string
  email: string
}

const MOCK_PHONE_PREFIX = '+7 916 482-17-'
const MOCK_PHONE_FIRST_SUFFIX = 30
const MOCK_PHONE_SUFFIXES = 60

export function getMockUserContacts(userId: number, login: string): UserContacts {
  return { phone: `${MOCK_PHONE_PREFIX}${MOCK_PHONE_FIRST_SUFFIX + (userId % MOCK_PHONE_SUFFIXES)}`, email: `${login.toLowerCase()}@example.ru` }
}
