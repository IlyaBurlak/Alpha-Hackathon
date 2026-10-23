import { observer } from 'mobx-react-lite'
import { Navigate, Outlet } from 'react-router'

import { useSessionStore } from '@/entities/session'
import { ROUTES } from '@/shared/config'

export const RequireAuth = observer(function RequireAuth() {
  const session = useSessionStore()
  return session.isAuthenticated ? <Outlet /> : <Navigate to={ROUTES.login} replace />
})

export const GuestOnly = observer(function GuestOnly() {
  const session = useSessionStore()
  return session.isAuthenticated ? <Navigate to={ROUTES.cabinet} replace /> : <Outlet />
})
