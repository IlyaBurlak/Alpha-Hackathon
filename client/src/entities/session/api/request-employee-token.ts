import { UnexpectedResponseError, httpClient } from '@/shared/api'
import { isRecord } from '@/shared/lib'

import type { Credentials } from './request-token'
import { createDemoStaffToken, isDemoStaff } from './mocks/mock-demo-staff'

const EMPLOYEE_LOGIN_PATH = '/users/admin-login'

/** Signs a bank employee (operator) in; the token carries the `isAdmin` claim. */
export async function requestEmployeeToken({ login, password }: Credentials): Promise<string> {
  if (isDemoStaff(login, password)) return createDemoStaffToken(login)

  const payload = await httpClient.post(EMPLOYEE_LOGIN_PATH, { login, password })
  if (!isRecord(payload) || typeof payload.token !== 'string') {
    throw new UnexpectedResponseError('operator login payload has no token')
  }
  return payload.token
}
