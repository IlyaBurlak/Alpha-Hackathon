import { getApprovalChance, isSecuredOffer, suggestLowerSum } from '@/entities/application'
import type { CreditVariants } from '@/entities/application'
import { Button } from '@/shared/ui'
import { formatMoneyShort, formatPercent } from '@/shared/lib'

import { buildComparison, getVariantTone } from '../../lib/comparison'
import type { ComparisonTab } from '../../model/application-wizard-store'
import { ComparisonSection } from '../comparison/ComparisonSection'
import styles from './VariantStep.module.css'
import { VariantCard } from './VariantCard'

interface VariantStepProps {
  variants: CreditVariants
  organizationId: number
  sum: number
  selectedOfferId: number | null
  comparisonTab: ComparisonTab
  isScheduleExpanded: boolean
  onPick: (offerId: number) => void
  onComparisonTabChange: (tab: ComparisonTab) => void
  onToggleScheduleExpanded: () => void
  /** Asks to recalculate the offers for a smaller sum. */
  onApplySuggestedSum: (sum: number) => void
}

function getAdvice({ offers, recommendedId }: CreditVariants): string | null {
  const recommended = offers.find(({ id }) => id === recommendedId)
  if (recommended) {
    return isSecuredOffer(recommended)
      ? 'Без залога шанс одобрения невысокий. Залог заметно повышает его и снижает ставку.'
      : 'Без залога шанс одобрения хороший, оформить можно быстрее.'
  }
  const plain = offers.filter((offer) => !isSecuredOffer(offer)).sort((first, second) => first.interestRate - second.interestRate)[0]
  const secured = offers.filter(isSecuredOffer).sort((first, second) => first.interestRate - second.interestRate)[0]
  if (plain && secured && secured.interestRate < plain.interestRate) {
    return `С залогом ставка ниже на ${formatPercent(plain.interestRate - secured.interestRate)}.`
  }
  return null
}

/** Step 1: every offer of the bank for the sum and the term, and their comparison. */
export function VariantStep({
  variants,
  organizationId,
  sum,
  selectedOfferId,
  comparisonTab,
  isScheduleExpanded,
  onPick,
  onComparisonTabChange,
  onToggleScheduleExpanded,
  onApplySuggestedSum,
}: VariantStepProps) {
  const { offers, recommendedId } = variants
  const advice = getAdvice(variants)
  const compared = buildComparison(variants)
  const scoredOffer = offers.find(({ id }) => id === recommendedId) ?? offers[0]
  const scoring = scoredOffer?.scoring ?? null
  const bestScore = Math.max(0, ...offers.map((offer) => offer.scoring?.score ?? 0))
  const suggestion = scoring
    ? suggestLowerSum({ organizationId, sum, hasSecuredVariant: offers.some(isSecuredOffer), bestScore })
    : null

  return (
    <>
      {suggestion ? (
        <div className={styles.tip}>
          <span>
            С суммой <b>{formatMoneyShort(suggestion.sum)}</b> шанс одобрения станет{' '}
            {getApprovalChance(suggestion.score).label.toLowerCase()}
          </span>
          <Button size="small" onClick={() => onApplySuggestedSum(suggestion.sum)}>
            Пересчитать
          </Button>
        </div>
      ) : (
        advice && <p className={styles.hint}>{advice}</p>
      )}
      <div className={styles.variants}>
        {offers.map((offer, index) => (
          <VariantCard
            key={offer.id}
            offer={offer}
            tone={getVariantTone(index)}
            isRecommended={offer.id === recommendedId}
            isSelected={offer.id === selectedOfferId}
            onPick={onPick}
          />
        ))}
      </div>
      <ComparisonSection
        variants={compared}
        sum={sum}
        tab={comparisonTab}
        isScheduleExpanded={isScheduleExpanded}
        onTabChange={onComparisonTabChange}
        onToggleScheduleExpanded={onToggleScheduleExpanded}
      />
    </>
  )
}
