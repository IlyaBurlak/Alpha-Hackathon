/**
 * MOCK: fills in what the backend does not return and replays the user's own actions kept in the browser
 * (docs/frontend-mocks.md). Everything the backend sends wins over the mocks, so each block switches itself off
 * when the backend starts returning the field.
 */
import type { LocalApplicationDetails } from '../../lib/local-details/local-details'
import { APPLICATION_STATUSES } from '../../model/types'
import type { Application, ProductChoice, ReviewStage } from '../../model/types'
import { getMockProductExtras } from './mock-products'
import { estimateScoring } from './mock-scoring'

/** The demo bank "reviews" a sent application in three stages, each shown for this long. */
const REVIEW_STAGE_DURATION_MS = 3000
const LAST_REVIEW_STAGE: ReviewStage = 2
/** After signing, the money "arrives" in this time. */
export const PAYOUT_DURATION_MS = 4000

function enrichProductChoice(productChoice: ProductChoice, organizationId: number): ProductChoice {
  if (productChoice.kind !== 'offers') return productChoice
  return {
    kind: 'offers',
    items: productChoice.items.map((offer) => {
      const extras = getMockProductExtras(offer.id)
      return {
        ...offer,
        description: offer.description ?? extras?.description ?? null,
        decisionTime: offer.decisionTime ?? extras?.decisionTime ?? null,
        scoring:
          offer.scoring ?? estimateScoring({ organizationId, sum: offer.sum, isSecured: offer.collateral > 0 }),
      }
    }),
  }
}

function toDate(moment: number | null): Date | null {
  return moment === null ? null : new Date(moment)
}

function getReviewStage(application: Application, submittedAt: Date | null, now: number): ReviewStage | null {
  if (application.reviewStage !== null) return application.reviewStage
  if (application.status !== APPLICATION_STATUSES.submitted || submittedAt === null) return null
  const stage = Math.floor((now - submittedAt.getTime()) / REVIEW_STAGE_DURATION_MS)
  if (stage <= 0) return 0
  return stage >= LAST_REVIEW_STAGE ? LAST_REVIEW_STAGE : 1
}

export function applyMocks(application: Application, details: LocalApplicationDetails, now: number): Application {
  const submittedAt = application.submittedAt ?? toDate(details.submittedAt)
  const signedAt = application.signedAt ?? toDate(details.signedAt)
  const isDraft = application.status === APPLICATION_STATUSES.draft

  let { status, issuedAt } = application
  if (status === APPLICATION_STATUSES.signed) {
    // The backend knows only that the documents are signed; the payout is a client timer from the moment of signing
    // kept in this browser. Signed elsewhere, the moment is unknown and the money is shown as paid.
    const payoutAt = signedAt === null ? null : new Date(signedAt.getTime() + PAYOUT_DURATION_MS)
    status = payoutAt === null || now >= payoutAt.getTime() ? APPLICATION_STATUSES.issued : APPLICATION_STATUSES.payout
    issuedAt = issuedAt ?? payoutAt
  }

  return {
    ...application,
    status,
    submittedAt,
    signedAt,
    issuedAt,
    reviewStage: getReviewStage(application, submittedAt, now),
    productChoice: enrichProductChoice(application.productChoice, application.organizationId),
    scoring:
      application.scoring ??
      (isDraft
        ? null
        : estimateScoring({ organizationId: application.organizationId, sum: application.sum, isSecured: details.isSecured })),
  }
}

/** The payout runs on a client timer: once it ends the application is issued, with no request to the server. */
export function settlePayout(application: Application, now: number): Application {
  const isPayoutOver = application.status === APPLICATION_STATUSES.payout && application.issuedAt !== null && now >= application.issuedAt.getTime()
  return isPayoutOver ? { ...application, status: APPLICATION_STATUSES.issued } : application
}
