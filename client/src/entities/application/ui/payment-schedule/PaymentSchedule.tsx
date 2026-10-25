import { formatDate, formatMoney } from '@/shared/lib'
import { calculateLoan, getPaymentDate } from '../../lib/loan/loan-calculation'
import type { LoanInput } from '../../lib/loan/loan-calculation'
import styles from './PaymentSchedule.module.css'

interface PaymentScheduleProps {
  loan: LoanInput
  startDate: Date
}

/** Estimated payment dates, amounts and the remaining debt, calculated on the client. */
export function PaymentSchedule({ loan, startDate }: PaymentScheduleProps) {
  const { schedule } = calculateLoan(loan)

  return (
    <div className={styles.scroll}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Дата</th>
            <th scope="col" className={styles.right}>
              Платёж
            </th>
            <th scope="col" className={styles.right}>
              Остаток
            </th>
          </tr>
        </thead>
        <tbody>
          {schedule.map((row) => (
            <tr key={row.month}>
              <td>{formatDate(getPaymentDate(startDate, row.month))}</td>
              <td className={styles.right}>{formatMoney(row.payment)}</td>
              <td className={`${styles.right} ${styles.secondary}`}>{formatMoney(row.balance)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
