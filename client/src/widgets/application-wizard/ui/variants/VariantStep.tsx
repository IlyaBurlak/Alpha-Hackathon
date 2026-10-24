import { ScoreFactors, ScoreGauge, formatMoneyShort, formatPercent, getApprovalChance, suggestLowerSum } from '@/entities/application'
import type { CreditVariants } from '@/entities/application'
import { Button } from '@/shared/ui'

import { buildComparison } from '../../lib/comparison'
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

function getAdvice({ plain, secured, recommended }: CreditVariants): string | null {
  if (recommended === 'secured') return 'Без залога шанс одобрения невысокий. Залог заметно повышает его и снижает ставку.'
  if (recommended === 'plain') return 'Без залога шанс одобрения хороший, оформить можно быстрее.'
  if (plain && secured && secured.interestRate < plain.interestRate) {
    return `С залогом ставка ниже на ${formatPercent(plain.interestRate - secured.interestRate)}.`
  }
  return null
}

/** Step 1: the best offer without and with collateral, their comparison and the reasons behind the estimate. */
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
  const { plain, secured, recommended } = variants
  const advice = getAdvice(variants)
  const compared = buildComparison(variants)
  const scoredOffer = (recommended === null ? plain : variants[recommended]) ?? secured
  const scoring = scoredOffer?.scoring ?? null
  const bestScore = Math.max(plain?.scoring?.score ?? 0, secured?.scoring?.score ?? 0)
  const suggestion = scoring
    ? suggestLowerSum({ organizationId, sum, hasSecuredVariant: secured !== null, bestScore })
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
        <VariantCard
          kind="plain"
          offer={plain}
          isRecommended={recommended === 'plain'}
          isSelected={plain !== null && plain.id === selectedOfferId}
          onPick={onPick}
        />
        <VariantCard
          kind="secured"
          offer={secured}
          isRecommended={recommended === 'secured'}
          isSelected={secured !== null && secured.id === selectedOfferId}
          onPick={onPick}
        />
      </div>
      <ComparisonSection
        variants={compared}
        sum={sum}
        tab={comparisonTab}
        isScheduleExpanded={isScheduleExpanded}
        onTabChange={onComparisonTabChange}
        onToggleScheduleExpanded={onToggleScheduleExpanded}
      />
      {scoring && (
        <section className={`${styles.scoreBox} ${styles.box}`}>
          <h2>Как мы оценили заявку</h2>
          <p className={styles.scoreNote}>
            Предварительная оценка по данным банка. Итоговое решение принимает банк после проверки.
          </p>
          <div className={styles.score}>
            <ScoreGauge score={scoring.score} />
            <div>
              <ScoreFactors factors={scoring.factors} />
            </div>
          </div>
        </section>
      )}
    </>
  )
}
