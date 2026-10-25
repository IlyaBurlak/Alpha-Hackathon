import type { MonthlyTurnover } from '@/entities/staff-application'
import { formatMoney, formatMoneyShort } from '@/shared/lib'

import styles from './TurnoverChart.module.css'

const WIDTH = 640
const HEIGHT = 180
const LEFT = 52
const BOTTOM = 26
const TOP = 8
const HEADROOM = 1.1
const BAR_WIDTH_SHARE = 0.6
const BAR_OFFSET_SHARE = 0.2
const DIP_SHARE_OF_AVERAGE = 0.5
const GRID_FRACTIONS = [0, 0.5, 1]
const RUBLE_SUFFIX = / ₽$/

interface TurnoverChartProps {
  turnover: readonly MonthlyTurnover[]
  /** The payment of the new loan: drawn as a line to compare with the monthly income. */
  newPayment: number | null
}

/** Income of the account by month; months below half of the average are yellow, the new payment is a red dashed line. */
export function TurnoverChart({ turnover, newPayment }: TurnoverChartProps) {
  const max = Math.max(...turnover.map(({ amount }) => amount), newPayment ?? 0) * HEADROOM
  const average = turnover.reduce((total, { amount }) => total + amount, 0) / turnover.length
  const barSlot = (WIDTH - LEFT) / turnover.length
  const toY = (amount: number) => TOP + (1 - amount / max) * (HEIGHT - TOP - BOTTOM)

  return (
    <div className={styles.chart}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width="100%" role="img" aria-label="Обороты по счёту за 12 месяцев">
        {GRID_FRACTIONS.map((fraction) => (
          <g key={fraction}>
            <line x1={LEFT} x2={WIDTH} y1={toY(max * fraction)} y2={toY(max * fraction)} className={styles.gridLine} />
            <text x={LEFT - 8} y={toY(max * fraction) + 4} textAnchor="end" className={styles.axis}>
              {fraction === 0 ? '0' : formatMoneyShort(max * fraction).replace(RUBLE_SUFFIX, '')}
            </text>
          </g>
        ))}
        {turnover.map(({ month, amount }, index) => {
          const isDip = amount < average * DIP_SHARE_OF_AVERAGE
          const x = LEFT + index * barSlot
          return (
            <g key={`${month}-${index}`}>
              <rect
                x={x + barSlot * BAR_OFFSET_SHARE}
                y={toY(amount)}
                width={barSlot * BAR_WIDTH_SHARE}
                height={HEIGHT - BOTTOM - toY(amount)}
                rx="4"
                className={isDip ? styles.dip : styles.bar}
              >
                <title>{`${month}: ${formatMoney(amount)}`}</title>
              </rect>
              <text x={x + barSlot / 2} y={HEIGHT - 8} textAnchor="middle" className={styles.axis}>
                {month}
              </text>
            </g>
          )
        })}
        {newPayment !== null && (
          <>
            <line x1={LEFT} x2={WIDTH} y1={toY(newPayment)} y2={toY(newPayment)} className={styles.paymentLine} />
            <text x={WIDTH} y={toY(newPayment) - 6} textAnchor="end" className={styles.paymentLabel}>
              Новый платёж {formatMoney(newPayment)}
            </text>
          </>
        )}
      </svg>
    </div>
  )
}
