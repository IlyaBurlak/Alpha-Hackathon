import type { LoanLine } from '@/entities/staff-application'
import { formatMoney } from '@/shared/lib'

import styles from './LoansTable.module.css'

interface LoansTableProps {
  loans: readonly LoanLine[]
}

/** The credits the company already has, with the total. */
export function LoansTable({ loans }: LoansTableProps) {
  const totalBalance = loans.reduce((total, loan) => total + loan.balance, 0)
  const totalPayment = loans.reduce((total, loan) => total + loan.monthlyPayment, 0)

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th scope="col">Кредитор</th>
          <th scope="col" className={styles.right}>
            Остаток
          </th>
          <th scope="col" className={styles.right}>
            Платёж в месяц
          </th>
          <th scope="col" className={styles.right}>
            Просрочки
          </th>
        </tr>
      </thead>
      <tbody>
        {loans.map((loan) => (
          <tr key={loan.creditor}>
            <td>{loan.creditor}</td>
            <td className={styles.right}>{formatMoney(loan.balance)}</td>
            <td className={styles.right}>{formatMoney(loan.monthlyPayment)}</td>
            <td className={`${styles.right} ${loan.overdue ? styles.overdue : ''}`}>{loan.overdue ?? 'Нет'}</td>
          </tr>
        ))}
        <tr>
          <td>
            <b>Итого</b>
          </td>
          <td className={styles.right}>
            <b>{formatMoney(totalBalance)}</b>
          </td>
          <td className={styles.right}>
            <b>{formatMoney(totalPayment)}</b>
          </td>
          <td />
        </tr>
      </tbody>
    </table>
  )
}
