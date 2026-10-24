import { Loader } from '@alfalab/core-components/loader'
import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router'

import { ROUTES } from '@/shared/config'
import { CabinetLayout } from '@/widgets/cabinet-shell'

import { GuestOnly, RequireAuth } from './guards'

const LoginPage = lazy(() => import('@/pages/login').then((module) => ({ default: module.LoginPage })))
const AdminPage = lazy(() => import('@/pages/admin').then((module) => ({ default: module.AdminPage })))
const HomePage = lazy(() => import('@/pages/home').then((module) => ({ default: module.HomePage })))
const ApplicationsPage = lazy(() =>
  import('@/pages/applications').then((module) => ({ default: module.ApplicationsPage })),
)
const ApplicationPage = lazy(() => import('@/pages/application').then((module) => ({ default: module.ApplicationPage })))
const ApplicationEditPage = lazy(() =>
  import('@/pages/application-edit').then((module) => ({ default: module.ApplicationEditPage })),
)
const HelpPage = lazy(() => import('@/pages/help').then((module) => ({ default: module.HelpPage })))

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
      {
        element: <CabinetLayout />,
        children: [
          { path: ROUTES.cabinet, element: <HomePage /> },
          { path: ROUTES.applications, element: <ApplicationsPage /> },
          { path: ROUTES.application, element: <ApplicationPage /> },
          { path: ROUTES.applicationEdit, element: <ApplicationEditPage /> },
          { path: ROUTES.help, element: <HelpPage /> },
        ],
      },
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
