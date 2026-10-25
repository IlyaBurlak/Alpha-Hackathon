import { APPROVAL_SCORE } from './approval-chance'
import type { ProductOffer } from '../../model/types'

export interface CreditVariants {
  /** Every offer of the bank for the application: the ones without collateral first, each group from the cheapest. */
  offers: ProductOffer[]
  /** The offer the bank advises; `null` while there is no scoring to base advice on. */
  recommendedId: number | null
}

export function isSecuredOffer(offer: ProductOffer): boolean {
  return offer.collateral > 0
}

function pickCheapest(offers: readonly ProductOffer[]): ProductOffer | null {
  return offers.reduce<ProductOffer | null>(
    (cheapest, offer) => (cheapest === null || offer.interestRate < cheapest.interestRate ? offer : cheapest),
    null,
  )
}

function sortByRate(offers: readonly ProductOffer[]): ProductOffer[] {
  return [...offers].sort((first, second) => first.interestRate - second.interestRate)
}

/** The advice follows the estimate of the best offer of each kind: without collateral if it is good enough. */
function pickRecommendedId(plain: ProductOffer | null, secured: ProductOffer | null): number | null {
  if (!plain?.scoring && !secured?.scoring) return null
  if (plain?.scoring && plain.scoring.score >= APPROVAL_SCORE) return plain.id
  return (secured ?? plain)?.id ?? null
}

/** The cabinet shows every product the bank offers for the sum and the term, however many there are. */
export function pickVariants(offers: readonly ProductOffer[]): CreditVariants {
  const plain = offers.filter((offer) => !isSecuredOffer(offer))
  const secured = offers.filter(isSecuredOffer)
  return {
    offers: [...sortByRate(plain), ...sortByRate(secured)],
    recommendedId: pickRecommendedId(pickCheapest(plain), pickCheapest(secured)),
  }
}
