import { formatCreditTime } from '@/entities/application'
import { formatMoney, formatPercent } from '@/shared/lib'

import type { ComparedVariant } from '../../lib/comparison'
import styles from './StructureView.module.css'
import { VariantSwatch } from './swatch/VariantSwatch'

const PERCENT = 100

const ROWS: ReadonlyArray<{ label: string; getValue: (variant: ComparedVariant) => string }> = [
  { label: 'Продукт', getValue: ({ offer }) => offer.name },
  { label: 'Ставка', getValue: ({ offer }) => formatPercent(offer.interestRate) },
  { label: 'Срок', getValue: ({ offer }) => formatCreditTime(offer.creditTime) },
  { label: 'Платёж в месяц', getValue: ({ loan }) => formatMoney(loan.monthlyPayment) },
  { label: 'Проценты за весь срок', getValue: ({ loan }) => formatMoney(loan.totalInterest) },
  { label: 'Всего выплат', getValue: ({ loan }) => formatMoney(loan.totalPayout) },
  { label: 'Залог', getValue: ({ kind }) => (kind === 'secured' ? 'Нужен' : 'Не нужен') },
  { label: 'Решение', getValue: ({ offer }) => offer.decisionTime ?? '—' },
]

interface StructureViewProps {
  variants: readonly ComparedVariant[]
  sum: number
}

/** How much of the total payout is the loan itself and how much is interest, per variant, plus a side-by-side table. */
export function StructureView({ variants, sum }: StructureViewProps) {
  const largestTotal = Math.max(...variants.map(({ loan }) => loan.totalPayout))

  return (
    <>
      <div className={styles.legend}>
        <span>
          <VariantSwatch tone="neutral" />
          Сумма кредита
        </span>
        <span>
          <VariantSwatch tone="neutral" isFaded />
          Проценты банку
        </span>
      </div>
      <div className={styles.bars}>
        {variants.map(({ kind, label, loan }) => (
          <div key={kind} className={styles[kind]}>
            <div className={styles.barHeader}>
              <b>
                <VariantSwatch tone={kind} />
                {label}
              </b>
              <span>{formatMoney(loan.totalPayout)}</span>
            </div>
            <div className={styles.bar} style={{ width: `${(loan.totalPayout / largestTotal) * PERCENT}%` }}>
              <i className={styles.barPrincipal} style={{ width: `${(sum / loan.totalPayout) * PERCENT}%` }} />
              <i className={styles.barInterest} />
            </div>
            <div className={styles.barLabels}>
              <span>Кредит {formatMoney(sum)}</span>
              <span>
                Проценты {formatMoney(loan.totalInterest)}, {Math.round((loan.totalInterest / sum) * PERCENT)}% от суммы
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className={styles.scrollX}>
        <table className={styles.compareTable}>
          <thead>
            <tr>
              <th />
              {variants.map(({ kind, label }) => (
                <th key={kind}>
                  <VariantSwatch tone={kind} className={styles.swatchSpacing} />
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map(({ label, getValue }) => (
              <tr key={label}>
                <td>{label}</td>
                {variants.map((variant) => (
                  <td key={variant.kind}>{getValue(variant)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
