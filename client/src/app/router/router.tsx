import { Loader } from '@alfalab/core-components/loader'
import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router'

import { ROUTES } from '@/shared/config'

import { GuestOnly, RequireAuth } from './guards'

const LoginPage = lazy(() => import('@/pages/login').then((module) => ({ default: module.LoginPage })))
const AdminPage = lazy(() => import('@/pages/admin').then((module) => ({ default: module.AdminPage })))
const ApplicationPage = lazy(() =>
  import('@/pages/application').then((module) => ({ default: module.ApplicationPage })),
)
const CabinetPage = lazy(() => import('@/pages/cabinet').then((module) => ({ default: module.CabinetPage })))

const router = createBrowserRouter([
  { path: ROUTES.root, element: <Navigate to={ROUTES.cabinet} replace /> },
  { path: ROUTES.admin, element: <AdminPage /> },
  {
    element: <GuestOnly />,
    children: [{ path: ROUTES.login, element: <LoginPage /> }],
  },
  {
    element: <RequireAuth />,
    children: [
      { path: ROUTES.cabinet, element: <CabinetPage /> },
      { path: ROUTES.application, element: <ApplicationPage /> },
    ],
  },
])

export function AppRouter() {
  return (
    <Suspense fallback={<Loader />}>
      <RouterProvider router={router} />
    </Suspense>
  )
}
