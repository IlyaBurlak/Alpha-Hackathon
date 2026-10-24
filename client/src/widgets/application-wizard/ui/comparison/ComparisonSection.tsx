import { useState } from 'react'

import { formatCreditTime, formatMoney, formatPercent } from '@/entities/application'
import { Segmented } from '@/shared/ui'

import { getDifference } from '../../lib/comparison'
import type { ComparedVariant, ComparisonDifference } from '../../lib/comparison'
import type { ComparisonTab } from '../../model/application-wizard-store'
import { BalanceChart } from './BalanceChart'
import styles from './ComparisonSection.module.css'
import { ScheduleView } from './ScheduleView'
import { VariantSwatch } from './swatch/VariantSwatch'
import { StructureView } from './StructureView'

const TAB_OPTIONS: ReadonlyArray<{ value: ComparisonTab; label: string }> = [
  { value: 'structure', label: 'Структура выплат' },
  { value: 'balance', label: 'Выплаты по месяцам' },
  { value: 'schedule', label: 'График платежей' },
]

interface ComparisonSectionProps {
  variants: readonly ComparedVariant[]
  sum: number
  tab: ComparisonTab
  isScheduleExpanded: boolean
  onTabChange: (tab: ComparisonTab) => void
  onToggleScheduleExpanded: () => void
}

function getWinner(difference: number, wins: string, loses: string): string {
  return difference > 0 ? wins : loses
}

interface DifferenceCardsProps {
  difference: ComparisonDifference
}

function DifferenceCards({ difference }: DifferenceCardsProps) {
  const cards = [
    {
      label: 'Разница в переплате',
      value: formatMoney(Math.abs(difference.overpayment)),
      note: getWinner(difference.overpayment, 'меньше с залогом', 'меньше без залога'),
    },
    {
      label: 'Разница в платеже',
      value: formatMoney(Math.abs(difference.monthlyPayment)),
      note: getWinner(difference.monthlyPayment, 'в месяц меньше с залогом', 'в месяц меньше без залога'),
    },
    {
      label: 'Разница в ставке',
      value: formatPercent(Math.abs(difference.rate)),
      note: getWinner(difference.rate, 'ниже с залогом', 'ниже без залога'),
    },
  ]
  return (
    <div className={styles.diff}>
      {cards.map(({ label, value, note }) => (
        <div key={label} className={styles.diffItem}>
          <small className={styles.diffLabel}>{label}</small>
          <b className={styles.diffValue}>{value}</b>
          <span className={styles.diffNote}>{note}</span>
        </div>
      ))}
    </div>
  )
}

/** Variants side by side: how the payout splits into loan and interest, the monthly balance chart and the schedule. */
export function ComparisonSection({
  variants,
  sum,
  tab,
  isScheduleExpanded,
  onTabChange,
  onToggleScheduleExpanded,
}: ComparisonSectionProps) {
  const [startDate] = useState(() => new Date())
  const difference = getDifference(variants)

  return (
    <section className={styles.box}>
      <div className={styles.header}>
        <div>
          <h2>Сравнение вариантов</h2>
          <p className={styles.subtitle}>{formatMoney(sum)}, расчёт аннуитетными платежами</p>
        </div>
        <Segmented options={TAB_OPTIONS} value={tab} onChange={onTabChange} ariaLabel="Вид сравнения" />
      </div>
      {difference && <DifferenceCards difference={difference} />}
      <div className={styles.body}>
        {tab === 'structure' && <StructureView variants={variants} sum={sum} />}
        {tab === 'balance' && (
          <>
            <div className={styles.legend}>
              {variants.map(({ kind, label, offer }) => (
                <span key={kind}>
                  <VariantSwatch tone={kind} />
                  {label}, {formatCreditTime(offer.creditTime)}
                </span>
              ))}
            </div>
            <BalanceChart variants={variants} sum={sum} />
            <p className={styles.chartNote}>
              Сколько всего вы заплатите банку к каждому месяцу. Наведите на график, чтобы увидеть сумму и остаток долга.
            </p>
          </>
        )}
        {tab === 'schedule' && (
          <ScheduleView
            variants={variants}
            startDate={startDate}
            isExpanded={isScheduleExpanded}
            onToggleExpanded={onToggleScheduleExpanded}
          />
        )}
      </div>
    </section>
  )
}
