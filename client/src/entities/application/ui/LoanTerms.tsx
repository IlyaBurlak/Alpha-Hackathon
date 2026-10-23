import { Typography } from '@alfalab/core-components/typography'

import { formatMoney } from '../lib/format'
import { calculateLoan } from '../lib/loan-calculation'
import type { LoanInput } from '../lib/loan-calculation'
import styles from './LoanTerms.module.css'

/** Estimated payments and payment schedule for a loan; the figures are calculated on the client. */
export function LoanTerms(loan: LoanInput) {
  const { monthlyPayment, totalPayout, totalInterest, schedule } = calculateLoan(loan)

  return (
    <div className={styles.terms}>
      <Typography.Text view="primary-small" defaultMargins={false}>
        Платёж в месяц: {formatMoney(monthlyPayment)}
      </Typography.Text>
      <Typography.Text view="primary-small" defaultMargins={false}>
        Всего к выплате: {formatMoney(totalPayout)}
      </Typography.Text>
      <Typography.Text view="primary-small" defaultMargins={false}>
        Переплата: {formatMoney(totalInterest)}
      </Typography.Text>
      <Typography.Text view="primary-small" color="secondary" defaultMargins={false}>
        Расчёт ориентировочный, итоговые условия определяет банк.
      </Typography.Text>
      <details className={styles.schedule}>
        <summary>График платежей</summary>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Месяц</th>
              <th scope="col">Платёж</th>
              <th scope="col">Основной долг</th>
              <th scope="col">Проценты</th>
              <th scope="col">Остаток</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((row) => (
              <tr key={row.month}>
                <td>{row.month}</td>
                <td>{formatMoney(row.payment)}</td>
                <td>{formatMoney(row.principal)}</td>
                <td>{formatMoney(row.interest)}</td>
                <td>{formatMoney(row.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  )
}
