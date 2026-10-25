import type { StaffApplication } from '@/entities/staff-application'
import {
  AMOUNT_TO_REVENUE_LIMIT,
  DEBT_TO_REVENUE_LIMIT,
  PAYMENT_TO_MONTHLY_REVENUE_LIMIT,
} from '@/entities/staff-application'
import { calculateAnnuityPayment, formatMoneyShort } from '@/shared/lib'

import { FigureTiles } from '../figure-tiles/FigureTiles'
import type { FigureTile } from '../figure-tiles/FigureTiles'
import { ReviewSection } from '../review-section/ReviewSection'
import styles from './FinanceSection.module.css'
import { LoansTable } from './LoansTable'
import { TurnoverChart } from './turnover-chart/TurnoverChart'

const PERCENT = 100
const MONTHS_IN_YEAR = 12
const UNKNOWN = '—'

function formatShare(share: number): string {
  return `${Math.round(share * PERCENT)}%`
}

function formatLimit(limit: number): string {
  return `порог ${limit * PERCENT}%`
}

interface FinanceSectionProps {
  application: StaffApplication
}

/** Revenue, debt load and the new payment against the income, the account turnover and the credits of the company. */
export function FinanceSection({ application }: FinanceSectionProps) {
  const { company, amount, termInMonths, scoring } = application
  // Without revenue the shares cannot be counted: the tiles say "—" instead of Infinity or NaN.
  const { annualRevenue, debt } = company
  const revenue = annualRevenue !== null && annualRevenue > 0 ? annualRevenue : null
  const amountShare = revenue === null ? null : amount / revenue
  const debtShare = revenue === null || debt === null ? null : debt / revenue
  const payment = scoring ? calculateAnnuityPayment(amount, scoring.rate, termInMonths) : null
  const paymentShare = payment === null || revenue === null ? null : payment / (revenue / MONTHS_IN_YEAR)

  const tiles: FigureTile[] = [
    { label: 'Выручка за 12 мес', value: annualRevenue === null ? UNKNOWN : formatMoneyShort(annualRevenue) },
    {
      label: 'Сумма к выручке',
      value: amountShare === null ? UNKNOWN : formatShare(amountShare),
      note: formatLimit(AMOUNT_TO_REVENUE_LIMIT),
      tone: amountShare === null ? 'attention' : amountShare < AMOUNT_TO_REVENUE_LIMIT ? 'positive' : 'negative',
    },
    {
      label: 'Долговая нагрузка',
      value: debtShare === null ? UNKNOWN : formatShare(debtShare),
      note: formatLimit(DEBT_TO_REVENUE_LIMIT),
      tone: debtShare === null ? 'attention' : debtShare < DEBT_TO_REVENUE_LIMIT ? 'positive' : 'negative',
    },
    {
      label: 'Платёж к выручке',
      value: paymentShare === null ? UNKNOWN : formatShare(paymentShare),
      note: formatLimit(PAYMENT_TO_MONTHLY_REVENUE_LIMIT),
      tone: paymentShare === null || paymentShare >= PAYMENT_TO_MONTHLY_REVENUE_LIMIT ? 'attention' : 'positive',
    },
  ]

  return (
    <ReviewSection id="s-fin" title="Финансовое состояние" source="Обороты по счёту, БКИ">
      <FigureTiles tiles={tiles} />
      <h3 className={styles.title}>Обороты по расчётному счёту</h3>
      <p className={styles.hint}>Поступления по месяцам. Жёлтым отмечены провалы ниже половины среднего.</p>
      <div className={styles.chart}>
        {application.turnover.length === 0 ? (
          <p className={styles.hint}>Данных об оборотах нет: реестр не передал остатки по счёту.</p>
        ) : (
          <TurnoverChart turnover={application.turnover} newPayment={payment} />
        )}
      </div>
      <h3 className={styles.loansTitle}>Действующие кредиты</h3>
      {debt === null ? <p className={styles.hint}>Данных нет: бюро кредитных историй не передало кредиты.</p> : <LoansTable loans={application.loans} />}
    </ReviewSection>
  )
}
