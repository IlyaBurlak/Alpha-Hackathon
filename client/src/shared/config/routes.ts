export const ROUTES = {
  root: '/',
  login: '/login',
  cabinet: '/cabinet',
  applications: '/cabinet/applications',
  application: '/cabinet/applications/:applicationId',
  applicationEdit: '/cabinet/applications/:applicationId/edit',
  help: '/cabinet/help',
  admin: '/admin',
} as const

export function getApplicationPath(applicationId: number): string {
  return `${ROUTES.applications}/${applicationId}`
}

export function getApplicationEditPath(applicationId: number): string {
  return `${getApplicationPath(applicationId)}/edit`
}
