import { ApprovalChanceMeter, calculateLoan, formatCreditTime, formatMoney, formatPercent } from '@/entities/application'
import type { ProductOffer, VariantKind } from '@/entities/application'
import { classNames } from '@/shared/lib'
import { Badge, Button, KeyValueList } from '@/shared/ui'

import { VARIANT_LABELS } from '../../lib/comparison'
import styles from './VariantCard.module.css'

interface VariantCardProps {
  kind: VariantKind
  /** `null` when the bank has no product of this kind for the requested sum and term. */
  offer: ProductOffer | null
  isRecommended: boolean
  isSelected: boolean
  onPick: (offerId: number) => void
}

export function VariantCard({ kind, offer, isRecommended, isSelected, onPick }: VariantCardProps) {
  if (offer === null) {
    return (
      <article className={classNames(styles.card, styles.unavailable)}>
        <div className={styles.cardTop}>
          <span className={styles.kind}>{VARIANT_LABELS[kind]}</span>
        </div>
        <h3 className={styles.cardTitle}>Кредит {VARIANT_LABELS[kind].toLowerCase()}</h3>
        <p className={styles.description}>Недоступен: нет подходящего продукта для этой суммы и срока</p>
      </article>
    )
  }

  const { monthlyPayment, totalInterest } = calculateLoan(offer)
  return (
    <article className={classNames(styles.card, isRecommended && styles.recommended, isSelected && styles.selected)}>
      <div className={styles.cardTop}>
        <span className={styles.kind}>
          <i className={classNames(styles.kindDot, kind === 'secured' && styles.kindDotSecured)} />
          {VARIANT_LABELS[kind]}
        </span>
        {isSelected && <Badge tone="positive">Выбран</Badge>}
        {!isSelected && isRecommended && <Badge tone="dark">Рекомендуем</Badge>}
      </div>
      <h3 className={styles.cardTitle}>{offer.name}</h3>
      <p className={styles.description}>{offer.description ?? offer.payments}</p>
      <div className={styles.payment}>
        <small className={styles.paymentLabel}>Платёж в месяц</small>
        <b className={styles.paymentValue}>{formatMoney(monthlyPayment)}</b>
      </div>
      <div className={styles.terms}>
        <KeyValueList
          isCompact
          items={[
            { label: 'Ставка', value: formatPercent(offer.interestRate) },
            { label: 'Срок', value: formatCreditTime(offer.creditTime) },
            { label: 'Переплата', value: formatMoney(totalInterest) },
            ...(offer.decisionTime ? [{ label: 'Решение', value: offer.decisionTime }] : []),
          ]}
        />
      </div>
      {offer.scoring && (
        <div className={styles.chance}>
          <ApprovalChanceMeter score={offer.scoring.score} />
        </div>
      )}
      <div className={styles.pick}>
        <Button view={isSelected || isRecommended ? 'primary' : 'secondary'} isBlock onClick={() => onPick(offer.id)}>
          {isSelected ? 'Продолжить с этим вариантом' : 'Выбрать'}
        </Button>
      </div>
    </article>
  )
}
