import {
  PaymentSchedule,
  calculateLoan,
  formatCreditTime,
  formatMoney,
  formatPercent,
} from '@/entities/application'
import type { Application } from '@/entities/application'
import { Icon, KeyValueList } from '@/shared/ui'
import type { KeyValueItem } from '@/shared/ui'

import styles from './ConditionsBox.module.css'

interface ConditionsBoxProps {
  application: Application
}

/** Sum, term and, when the chosen product is known, rate, payment, overpayment and the payment schedule. */
export function ConditionsBox({ application }: ConditionsBoxProps) {
  const { productChoice, sum, creditTime } = application
  const items: KeyValueItem[] = [
    { label: 'Сумма', value: formatMoney(sum) },
    { label: 'Срок', value: formatCreditTime(creditTime) },
  ]

  if (productChoice.kind !== 'selected') {
    return (
      <section className={styles.conditions}>
        <h3>Условия</h3>
        <div className={styles.conditionsList}>
          <KeyValueList items={items} />
        </div>
      </section>
    )
  }

  const loan = { sum, interestRate: productChoice.product.interestRate, creditTime }
  const { monthlyPayment, totalInterest } = calculateLoan(loan)
  items.push(
    { label: 'Ставка', value: formatPercent(loan.interestRate) },
    { label: 'Платёж', value: formatMoney(monthlyPayment) },
    { label: 'Переплата', value: formatMoney(totalInterest) },
  )

  return (
    <section className={styles.conditions}>
      <h3>Условия</h3>
      <div className={styles.conditionsList}>
        <KeyValueList items={items} />
      </div>
      <details className={styles.more}>
        <summary className={styles.moreSummary}>
          График платежей
          <Icon name="down" size={18} />
        </summary>
        <PaymentSchedule loan={loan} startDate={application.issuedAt ?? application.createdAt} />
      </details>
    </section>
  )
}
