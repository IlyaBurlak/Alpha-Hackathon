import { APPLICATION_STATUSES } from '../../model/types'
import type { Application } from '../../model/types'

/** The payout runs on a client timer: once it ends the application is issued, with no request to the server. */
export function settlePayout(application: Application, now: number): Application {
  const isPayoutOver =
    application.status === APPLICATION_STATUSES.payout && application.issuedAt !== null && now >= application.issuedAt.getTime()
  return isPayoutOver ? { ...application, status: APPLICATION_STATUSES.issued } : application
}
