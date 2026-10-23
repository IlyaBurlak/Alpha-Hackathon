export const ORGANIZATION_TYPES = {
  legalEntity: 'legal-entity',
  soleProprietor: 'sole-proprietor',
} as const

export type OrganizationType = (typeof ORGANIZATION_TYPES)[keyof typeof ORGANIZATION_TYPES]

export interface Organization {
  id: number
  inn: string
  name: string
  type: OrganizationType
}

export interface User {
  id: number
  login: string
  fullName: string
  organizations: Organization[]
}
