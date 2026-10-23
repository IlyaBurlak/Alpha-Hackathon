import { Typography } from '@alfalab/core-components/typography'
import type { ReactNode } from 'react'

import { formatCreditTime, formatMoney } from '../lib/format'
import type { ProductOffer } from '../model/types'
import styles from './ApplicationCard.module.css'
import { LoanTerms } from './LoanTerms'

interface ProductOfferCardProps {
  offer: ProductOffer
  /** Control that selects the offer, supplied by the composing layer. */
  action?: ReactNode
}

export function ProductOfferCard({ offer, action }: ProductOfferCardProps) {
  return (
    <article className={styles.card} aria-label={offer.name}>
      <Typography.Title tag="h3" view="xsmall" font="system" defaultMargins={false}>
        {offer.name}
      </Typography.Title>
      <Typography.Text view="primary-small" defaultMargins={false}>
        Сумма: {formatMoney(offer.sum)} на {formatCreditTime(offer.creditTime)}
      </Typography.Text>
      <Typography.Text view="primary-small" defaultMargins={false}>
        Ставка: {offer.interestRate}%
      </Typography.Text>
      <Typography.Text view="primary-small" defaultMargins={false}>
        Залог: {offer.collateral > 0 ? formatMoney(offer.collateral) : 'не требуется'}
      </Typography.Text>
      <Typography.Text view="primary-small" color="secondary" defaultMargins={false}>
        Выплаты: {offer.payments}
      </Typography.Text>
      <LoanTerms sum={offer.sum} interestRate={offer.interestRate} creditTime={offer.creditTime} />
      {action}
    </article>
  )
}
