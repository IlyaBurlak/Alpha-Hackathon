/**
 * MOCK: demo logins of the staff cabinet from the design (`ivanova`, `orlov`, `kim`, password `demo2026`).
 * They work without the backend: a local token with the `isAdmin` claim is issued instead.
 * Real operators (`alfaOperator1`, `alfaOperator2`) log in through the backend as usual.
 * Delete this file when the demo is not needed (docs/frontend-mocks.md).
 */
export const DEMO_STAFF_PASSWORD = 'demo2026'
const DEMO_STAFF_LOGINS: readonly string[] = ['ivanova', 'orlov', 'kim']
const DEMO_SESSION_HOURS = 8
const MS_IN_HOUR = 3_600_000
const SECONDS_IN_MS = 1000

export function isDemoStaff(login: string, password: string): boolean {
  return DEMO_STAFF_LOGINS.includes(login.trim().toLowerCase()) && password === DEMO_STAFF_PASSWORD
}

function toBase64Url(text: string): string {
  return btoa(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** An unsigned token in the shape the backend issues; it only selects the cabinet and carries no rights. */
export function createDemoStaffToken(login: string, now: number = Date.now()): string {
  const claims = {
    login: login.trim().toLowerCase(),
    isAdmin: true,
    exp: Math.floor((now + DEMO_SESSION_HOURS * MS_IN_HOUR) / SECONDS_IN_MS),
  }
  return `${toBase64Url(JSON.stringify({ alg: 'none', typ: 'JWT' }))}.${toBase64Url(JSON.stringify(claims))}.demo`
}
