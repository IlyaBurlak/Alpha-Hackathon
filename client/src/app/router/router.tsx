import { Loader } from '@alfalab/core-components/loader'
import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router'

import { USER_ROLES } from '@/entities/session'
import { ROUTES } from '@/shared/config'
import { CabinetLayout } from '@/widgets/cabinet-shell'
import { StaffLayout } from '@/widgets/staff-shell'

import { GuestOnly, RequireRole, RootRedirect } from './guards'

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
const StaffLoginPage = lazy(() => import('@/pages/staff-login').then((module) => ({ default: module.StaffLoginPage })))
const StaffQueuePage = lazy(() => import('@/pages/staff-queue').then((module) => ({ default: module.StaffQueuePage })))
const StaffApplicationPage = lazy(() =>
  import('@/pages/staff-application').then((module) => ({ default: module.StaffApplicationPage })),
)

const router = createBrowserRouter([
  { path: ROUTES.root, element: <RootRedirect /> },
  { path: ROUTES.admin, element: <AdminPage /> },
  {
    element: <GuestOnly />,
    children: [
      { path: ROUTES.login, element: <LoginPage /> },
      { path: ROUTES.staffLogin, element: <StaffLoginPage /> },
    ],
  },
  {
    element: <RequireRole role={USER_ROLES.entrepreneur} />,
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
  {
    element: <RequireRole role={USER_ROLES.employee} />,
    children: [
      {
        element: <StaffLayout />,
        children: [
          { path: ROUTES.staff, element: <StaffQueuePage mode="queue" /> },
          { path: ROUTES.staffMine, element: <StaffQueuePage mode="mine" /> },
          { path: ROUTES.staffDone, element: <StaffQueuePage mode="done" /> },
          { path: ROUTES.staffApplication, element: <StaffApplicationPage /> },
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
