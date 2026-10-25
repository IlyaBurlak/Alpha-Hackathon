import { decodeJwtPayload } from '@/shared/lib'

import { USER_ROLES } from '../model/user-role'
import type { UserRole } from '../model/user-role'

export interface SessionClaims {
  login: string | null
  role: UserRole
}

/**
 * Who the token belongs to. The backend marks bank employees with `isAdmin` (see `POST /users/admin-login`);
 * any other valid token is an entrepreneur. The server checks the signature, the client only picks the cabinet.
 */
export function readSessionClaims(token: string): SessionClaims {
  const claims = decodeJwtPayload(token)
  return {
    login: typeof claims?.login === 'string' ? claims.login : null,
    role: claims?.isAdmin === true ? USER_ROLES.employee : USER_ROLES.entrepreneur,
  }
}
