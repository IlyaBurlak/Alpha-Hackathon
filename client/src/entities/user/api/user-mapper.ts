import { UnexpectedResponseError } from '@/shared/api'
import { isRecord } from '@/shared/lib'

import { ORGANIZATION_TYPES } from '../model/types'
import { getMockOrganizationProfile, getMockUserContacts } from './mocks/mock-profiles'
import type { Organization, OrganizationType, User } from '../model/types'

const ORGANIZATION_TYPE_BY_DTO: Record<string, OrganizationType> = {
  OO: ORGANIZATION_TYPES.legalEntity,
  IndividualEntrepreneur: ORGANIZATION_TYPES.soleProprietor,
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value !== '' ? value : null
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' ? value : null
}

function mapOrganization(dto: unknown): Organization {
  if (
    !isRecord(dto) ||
    typeof dto.id !== 'number' ||
    typeof dto.inn !== 'string' ||
    typeof dto.fullName !== 'string' ||
    typeof dto.type !== 'string' ||
    !(dto.type in ORGANIZATION_TYPE_BY_DTO)
  ) {
    throw new UnexpectedResponseError('invalid organization')
  }
  const type = ORGANIZATION_TYPE_BY_DTO[dto.type]
  const mock = getMockOrganizationProfile(dto.inn, type)
  return {
    id: dto.id,
    inn: dto.inn,
    name: dto.fullName,
    type,
    kpp: readString(dto.kpp) ?? mock.kpp,
    ogrn: readString(dto.ogrn) ?? mock.ogrn,
    head: readString(dto.head) ?? mock.head,
    address: readString(dto.address) ?? mock.address,
    account: readString(dto.account) ?? mock.account,
    role: readString(dto.role) ?? mock.role,
    annualRevenue: readNumber(dto.annualIncome) ?? mock.annualRevenue,
    employeesCount: readNumber(dto.employeesCount) ?? mock.employeesCount,
  }
}

export function mapUser(dto: unknown): User {
  if (
    !isRecord(dto) ||
    typeof dto.id !== 'number' ||
    typeof dto.login !== 'string' ||
    typeof dto.fullName !== 'string' ||
    !Array.isArray(dto.organizations)
  ) {
    throw new UnexpectedResponseError('invalid user')
  }
  const contacts = getMockUserContacts(dto.id, dto.login)
  return {
    id: dto.id,
    login: dto.login,
    fullName: dto.fullName,
    phone: readString(dto.phone) ?? contacts.phone,
    email: readString(dto.email) ?? contacts.email,
    organizations: dto.organizations.map(mapOrganization),
  }
}
