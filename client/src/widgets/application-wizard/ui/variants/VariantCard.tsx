import { ApprovalChanceMeter, calculateLoan, formatCreditTime, isSecuredOffer } from '@/entities/application'
import type { ProductOffer } from '@/entities/application'
import { classNames, formatMoney, formatPercent } from '@/shared/lib'
import { Badge, Button, KeyValueList } from '@/shared/ui'

import type { VariantTone } from '../../lib/comparison'
import styles from './VariantCard.module.css'

interface VariantCardProps {
  offer: ProductOffer
  tone: VariantTone
  isRecommended: boolean
  isSelected: boolean
  onPick: (offerId: number) => void
}

export function VariantCard({ offer, tone, isRecommended, isSelected, onPick }: VariantCardProps) {
  const { monthlyPayment, totalInterest } = calculateLoan(offer)
  return (
    <article className={classNames(styles.card, isRecommended && styles.recommended, isSelected && styles.selected)}>
      <div className={styles.cardTop}>
        <span className={styles.kind}>
          <i className={classNames(styles.kindDot, styles[tone])} />
          {isSecuredOffer(offer) ? 'С залогом' : 'Без залога'}
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
