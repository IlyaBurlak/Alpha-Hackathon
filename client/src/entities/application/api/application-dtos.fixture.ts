/**
 * Responses of the backend `/api/applications` endpoints, copied from a running server
 * (see server/README.md). When the backend contract changes, update these first: the contract tests fail
 * and show which mapping has to follow.
 */

const BASE_APPLICATION = {
  id: 2,
  userId: 1,
  organizationId: 1,
  sum: 1_000_000,
  status: 'DRAFT',
  createdAt: '2026-10-23T18:22:52.183Z',
  creditTime: { units: 'YEAR', value: 1 },
  loanIssuanceDate: '2026-10-23T18:22:52.183Z',
}

const PAYMENTS = 'ежемесячно, равными долями, с первым платежом через 6 месяцев'

export const PRODUCT_OFFER_DTO = {
  id: 1,
  name: 'Кредит для бизнеса с залогом',
  sum: 1_000_000,
  creditTime: { units: 'YEAR', value: 1 },
  collateral: 120_000,
  persentage: 10,
  payments: PAYMENTS,
}

/** The chosen product, returned in `product` of a sent application. */
export const SELECTED_PRODUCT_DTO = {
  name: 'Кредит для бизнеса с залогом',
  persentage: 10,
  payments: PAYMENTS,
}

/** POST /applications or GET /applications/:id while the product is not chosen and the bank answers. */
export const APPLICATION_WITH_OFFERS_DTO = {
  ...BASE_APPLICATION,
  productId: null,
  products: [
    PRODUCT_OFFER_DTO,
    { ...PRODUCT_OFFER_DTO, id: 4, name: 'Кредит для бизнеса с господдержкой', collateral: 0, persentage: 5 },
  ],
}

/** The bank services are unavailable: the backend omits `products`. */
export const APPLICATION_WITHOUT_OFFERS_DTO = { ...BASE_APPLICATION }

/** No product fits the requested sum and term. */
export const APPLICATION_WITH_EMPTY_OFFERS_DTO = { ...BASE_APPLICATION, products: [] }

/** The backend never returns the chosen product yet: a sent application looks like this, with leftover offers. */
export const SUBMITTED_APPLICATION_WITHOUT_PRODUCT_DTO = {
  ...APPLICATION_WITH_OFFERS_DTO,
  status: 'SUBMITTED',
}

export const SCORING_DTO = {
  score: 72,
  factors: [
    { title: 'Возраст бизнеса', description: '6 лет на рынке', points: 15 },
    { title: 'Кредитная история', description: 'Есть просрочка до 30 дней', points: -10, advice: 'Закройте просрочку' },
  ],
}

/** Target contract (see docs/backend-requirements.md): not returned by the backend yet. */
export const SCORED_APPLICATION_DTO = {
  ...APPLICATION_WITH_OFFERS_DTO,
  status: 'SUBMITTED',
  scoring: SCORING_DTO,
  reviewStage: 1,
  products: [{ ...PRODUCT_OFFER_DTO, scoring: SCORING_DTO }],
}

/** PUT /applications (the desired shape), GET /applications/:id and GET /applications/my after the product is chosen. */
export const SELECTED_APPLICATION_DTO = {
  ...BASE_APPLICATION,
  status: 'SUBMITTED',
  productId: 1,
  product: SELECTED_PRODUCT_DTO,
}
