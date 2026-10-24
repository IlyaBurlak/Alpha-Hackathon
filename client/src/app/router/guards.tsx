import { observer } from 'mobx-react-lite'
import { Navigate, Outlet } from 'react-router'

import { useSessionStore } from '@/entities/session'
import type { UserRole } from '@/entities/session'
import { HOME_PATH_BY_ROLE, ROUTES } from '@/shared/config'

const LOGIN_PATH_BY_ROLE: Record<UserRole, string> = {
  entrepreneur: ROUTES.login,
  employee: ROUTES.staffLogin,
}

interface RequireRoleProps {
  role: UserRole
}

/**
 * Lets only the given role in. The server enforces access; this only sends people to the screen that is theirs:
 * a signed-out visitor to the login of the cabinet, a signed-in one to their own cabinet.
 */
export const RequireRole = observer(function RequireRole({ role }: RequireRoleProps) {
  const { claims } = useSessionStore()
  if (!claims) return <Navigate to={LOGIN_PATH_BY_ROLE[role]} replace />
  if (claims.role !== role) return <Navigate to={HOME_PATH_BY_ROLE[claims.role]} replace />
  return <Outlet />
})

/** A login screen is for visitors only: someone signed in goes to the cabinet of their role. */
export const GuestOnly = observer(function GuestOnly() {
  const { claims } = useSessionStore()
  return claims ? <Navigate to={HOME_PATH_BY_ROLE[claims.role]} replace /> : <Outlet />
})

/** The address `/` leads to the cabinet of the signed-in role, or to the entrepreneur login. */
export const RootRedirect = observer(function RootRedirect() {
  const { claims } = useSessionStore()
  return <Navigate to={claims ? HOME_PATH_BY_ROLE[claims.role] : ROUTES.login} replace />
})
