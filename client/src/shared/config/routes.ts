export const ROUTES = {
  root: '/',
  login: '/login',
  cabinet: '/cabinet',
  applications: '/cabinet/applications',
  application: '/cabinet/applications/:applicationId',
  applicationEdit: '/cabinet/applications/:applicationId/edit',
  help: '/cabinet/help',
  admin: '/admin',
  staffLogin: '/staff/login',
  staff: '/staff',
  staffMine: '/staff/mine',
  staffDone: '/staff/done',
  staffApplication: '/staff/applications/:applicationId',
} as const

export function getApplicationPath(applicationId: number): string {
  return `${ROUTES.applications}/${applicationId}`
}

export function getApplicationEditPath(applicationId: number): string {
  return `${getApplicationPath(applicationId)}/edit`
}

export function getStaffApplicationPath(applicationId: string): string {
  return `${ROUTES.staff}/applications/${applicationId}`
}

export const HOME_PATH_BY_ROLE = {
  entrepreneur: ROUTES.cabinet,
  employee: ROUTES.staff,
} as const
