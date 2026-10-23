import { UnexpectedResponseError } from '@/shared/api'
import { isRecord } from '@/shared/lib'

import { ORGANIZATION_TYPES } from '../model/types'
import type { Organization, OrganizationType, User } from '../model/types'

const ORGANIZATION_TYPE_BY_DTO: Record<string, OrganizationType> = {
  OO: ORGANIZATION_TYPES.legalEntity,
  IndividualEntrepreneur: ORGANIZATION_TYPES.soleProprietor,
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
  return {
    id: dto.id,
    inn: dto.inn,
    name: dto.fullName,
    type: ORGANIZATION_TYPE_BY_DTO[dto.type],
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
  return {
    id: dto.id,
    login: dto.login,
    fullName: dto.fullName,
    organizations: dto.organizations.map(mapOrganization),
  }
}
