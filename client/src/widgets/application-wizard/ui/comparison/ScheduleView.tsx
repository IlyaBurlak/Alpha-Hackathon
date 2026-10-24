import { formatDate, formatMoney, formatMonths } from '@/entities/application'
import { TextButton } from '@/shared/ui'

import { getScheduleDates } from '../../lib/comparison'
import type { ComparedVariant } from '../../lib/comparison'
import styles from './ScheduleView.module.css'
import { VariantSwatch } from './swatch/VariantSwatch'

const COLLAPSED_ROWS = 12

interface ScheduleViewProps {
  variants: readonly ComparedVariant[]
  startDate: Date
  isExpanded: boolean
  onToggleExpanded: () => void
}

/** Month-by-month payments of all variants in one table, the first year by default. */
export function ScheduleView({ variants, startDate, isExpanded, onToggleExpanded }: ScheduleViewProps) {
  const dates = getScheduleDates(variants, startDate)
  const shownRows = isExpanded ? dates.length : Math.min(COLLAPSED_ROWS, dates.length)

  return (
    <>
      <div className={styles.scheduleWrap}>
        <table className={styles.scheduleTable}>
          <thead>
            <tr>
              <th rowSpan={2}>№</th>
              <th rowSpan={2}>Дата</th>
              {variants.map(({ kind, label }) => (
                <th key={kind} colSpan={3} className={styles.group}>
                  <VariantSwatch tone={kind} className={styles.swatchSpacing} />
                  {label}
                </th>
              ))}
            </tr>
            <tr>
              {variants.map(({ kind }) => (
                <ScheduleSubheaders key={kind} />
              ))}
            </tr>
          </thead>
          <tbody>
            {dates.slice(0, shownRows).map((date, index) => (
              <tr key={date.getTime()}>
                <td className={styles.muted}>{index + 1}</td>
                <td>{formatDate(date)}</td>
                {variants.map(({ kind, loan }) => {
                  const row = loan.schedule[index]
                  if (!row) {
                    return (
                      <td key={kind} colSpan={3} className={`${styles.right} ${styles.muted}`}>
                        Погашен
                      </td>
                    )
                  }
                  return (
                    <ScheduleCells key={kind} payment={row.payment} interest={row.interest} balance={row.balance} />
                  )
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2}>Итого</td>
              {variants.map(({ kind, loan }) => (
                <ScheduleTotals key={kind} payout={loan.totalPayout} interest={loan.totalInterest} />
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
      {dates.length > COLLAPSED_ROWS && (
        <div className={styles.moreButton}>
          <TextButton onClick={onToggleExpanded}>
            {isExpanded ? `Показать первые ${COLLAPSED_ROWS} месяцев` : `Показать все ${formatMonths(dates.length)}`}
          </TextButton>
        </div>
      )}
    </>
  )
}

function ScheduleSubheaders() {
  return (
    <>
      <th className={styles.right}>Платёж</th>
      <th className={styles.right}>Проценты</th>
      <th className={styles.right}>Остаток</th>
    </>
  )
}

interface ScheduleCellsProps {
  payment: number
  interest: number
  balance: number
}

function ScheduleCells({ payment, interest, balance }: ScheduleCellsProps) {
  return (
    <>
      <td className={`${styles.right} ${styles.strong}`}>{formatMoney(payment)}</td>
      <td className={`${styles.right} ${styles.muted}`}>{formatMoney(interest)}</td>
      <td className={styles.right}>{formatMoney(balance)}</td>
    </>
  )
}

interface ScheduleTotalsProps {
  payout: number
  interest: number
}

function ScheduleTotals({ payout, interest }: ScheduleTotalsProps) {
  return (
    <>
      <td className={styles.right}>{formatMoney(payout)}</td>
      <td className={styles.right}>{formatMoney(interest)}</td>
      <td className={`${styles.right} ${styles.muted}`}>{formatMoney(0)}</td>
    </>
  )
}
