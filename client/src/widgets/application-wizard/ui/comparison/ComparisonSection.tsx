import { useState } from 'react'

import { formatCreditTime } from '@/entities/application'
import { Segmented } from '@/shared/ui'
import { formatMoney, formatPercent } from '@/shared/lib'

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
  { value: 'balance', label: 'Переплата по месяцам' },
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

interface DifferenceCardsProps {
  difference: ComparisonDifference
}

/** Who has the smaller figure: the cheapest offer when the difference is positive, otherwise the other one. */
function getSmaller(value: number, { cheapest, priciest }: ComparisonDifference, word: string): string {
  return `${word} у «${(value > 0 ? cheapest : priciest).label}»`
}

function DifferenceCards({ difference }: DifferenceCardsProps) {
  const cards = [
    { label: 'Разница в переплате', value: formatMoney(Math.abs(difference.overpayment)), note: getSmaller(difference.overpayment, difference, 'меньше') },
    { label: 'Разница в платеже', value: formatMoney(Math.abs(difference.monthlyPayment)), note: getSmaller(difference.monthlyPayment, difference, 'в месяц меньше') },
    { label: 'Разница в ставке', value: formatPercent(Math.abs(difference.rate)), note: getSmaller(difference.rate, difference, 'ниже') },
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

/** Offers side by side: how the payout splits into loan and interest, the monthly balance chart and the schedule. */
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
              {variants.map(({ id, tone, label, offer }) => (
                <span key={id}>
                  <VariantSwatch tone={tone} />
                  {label}, {formatCreditTime(offer.creditTime)}
                </span>
              ))}
            </div>
            <BalanceChart variants={variants} sum={sum} />
            <p className={styles.chartNote}>
              Сколько процентов вы отдадите банку к каждому месяцу. Чем дальше линии друг от друга, тем дороже обходится продукт. Наведите на график: увидите переплату и остаток долга.
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
