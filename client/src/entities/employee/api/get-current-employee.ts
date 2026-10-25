import { UnexpectedResponseError, httpClient } from '@/shared/api'
import { decodeJwtPayload, isRecord, tokenStorage } from '@/shared/lib'

import { resolveEmployeeByLogin } from '../lib/find-employee'
import type { Employee } from '../model/types'

const CURRENT_OPERATOR_PATH = '/users/admin-info'
const OPERATOR_ID_PREFIX = 'op'
const INITIALS_LENGTH = 2

/** The backend writes "Surname Name"; the cabinet shows "Name Surname". */
function toDisplayName(fullName: string): string {
  const [surname, name, ...rest] = fullName.trim().split(/\s+/)
  return name ? [name, surname, ...rest].join(' ') : fullName
}

function toInitials(displayName: string): string {
  return displayName
    .split(' ')
    .slice(0, INITIALS_LENGTH)
    .map((word) => word.charAt(0).toUpperCase())
    .join('')
}

/** Only operators of the backend have a profile there; the demo employees of the design have no backend token. */
export function hasBackendProfile(): boolean {
  const token = tokenStorage.get()
  const claims = token ? decodeJwtPayload(token) : null
  return typeof claims?.id === 'number'
}

/** GET /users/admin-info: the name of the signed-in operator; the position comes from the directory. */
export async function getCurrentEmployee(): Promise<Employee> {
  const dto = await httpClient.get(CURRENT_OPERATOR_PATH)
  if (!isRecord(dto) || typeof dto.id !== 'number' || typeof dto.login !== 'string' || typeof dto.fullName !== 'string') {
    throw new UnexpectedResponseError('invalid operator profile')
  }
  const name = toDisplayName(dto.fullName)
  return { ...resolveEmployeeByLogin(dto.login), id: `${OPERATOR_ID_PREFIX}${dto.id}`, name, initials: toInitials(name) }
}
