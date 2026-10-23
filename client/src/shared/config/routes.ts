export const ROUTES = {
  root: '/',
  login: '/login',
  cabinet: '/cabinet',
  application: '/cabinet/applications/:applicationId',
  admin: '/admin',
} as const

export function getApplicationPath(applicationId: number): string {
  return `${ROUTES.cabinet}/applications/${applicationId}`
}
