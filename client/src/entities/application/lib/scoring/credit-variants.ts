import { APPROVAL_SCORE } from './approval-chance'
import type { ProductOffer } from '../../model/types'

export type VariantKind = 'plain' | 'secured'

export interface CreditVariants {
  /** The cheapest offer that needs no collateral. */
  plain: ProductOffer | null
  /** The cheapest offer that needs collateral. */
  secured: ProductOffer | null
  /** The variant the bank advises; `null` while there is no scoring to base advice on. */
  recommended: VariantKind | null
}

function isSecuredOffer(offer: ProductOffer): boolean {
  return offer.collateral > 0
}

function pickCheapest(offers: readonly ProductOffer[]): ProductOffer | null {
  return offers.reduce<ProductOffer | null>(
    (cheapest, offer) => (cheapest === null || offer.interestRate < cheapest.interestRate ? offer : cheapest),
    null,
  )
}

function pickRecommended(plain: ProductOffer | null, secured: ProductOffer | null): VariantKind | null {
  if (!plain?.scoring && !secured?.scoring) return null
  if (plain?.scoring && plain.scoring.score >= APPROVAL_SCORE) return 'plain'
  return secured ? 'secured' : 'plain'
}

/** The bank may offer several products; the cabinet shows the best of each kind: without and with collateral. */
export function pickVariants(offers: readonly ProductOffer[]): CreditVariants {
  const plain = pickCheapest(offers.filter((offer) => !isSecuredOffer(offer)))
  const secured = pickCheapest(offers.filter(isSecuredOffer))
  return { plain, secured, recommended: pickRecommended(plain, secured) }
}
