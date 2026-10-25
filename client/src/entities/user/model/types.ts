export const ORGANIZATION_TYPES = {
  legalEntity: 'legal-entity',
  soleProprietor: 'sole-proprietor',
} as const

export type OrganizationType = (typeof ORGANIZATION_TYPES)[keyof typeof ORGANIZATION_TYPES]

/** Requisites and figures of a company that the bank profile is expected to provide; `null` when unknown. */
export interface OrganizationProfile {
  /** Sole proprietors have no KPP. */
  kpp: string | null
  ogrn: string | null
  head: string | null
  address: string | null
  /** Masked settlement account the money comes to. */
  account: string | null
  /** The role of the user in this company, e.g. "Генеральный директор". */
  role: string | null
  /** Revenue for the last 12 months, rubles. */
  annualRevenue: number | null
  employeesCount: number | null
}

export interface Organization extends OrganizationProfile {
  id: number
  inn: string
  name: string
  type: OrganizationType
}

export interface User {
  id: number
  login: string
  fullName: string
  phone: string | null
  email: string | null
  organizations: Organization[]
}
