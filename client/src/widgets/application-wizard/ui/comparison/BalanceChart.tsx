import { useState } from 'react'
import type { MouseEvent } from 'react'

import { clamp, formatMoney, formatMoneyShort } from '@/shared/lib'

import type { ComparedVariant } from '../../lib/comparison'
import styles from './BalanceChart.module.css'
import { VariantSwatch } from './swatch/VariantSwatch'

const WIDTH = 720
const HEIGHT = 260
const PADDING = { left: 64, right: 16, top: 12, bottom: 32 }
const HEADROOM = 1.04
const GRID_FRACTIONS = [0, 0.25, 0.5, 0.75, 1]
const LONG_TERM_MONTHS = 36
const MEDIUM_TERM_MONTHS = 12
const TOOLTIP_GAP = 16
const RUBLE_SUFFIX = / ₽$/

const VARIANT_COLORS = { plain: 'var(--color-text)', secured: 'var(--color-red)' } as const

interface BalanceChartProps {
  variants: readonly ComparedVariant[]
  sum: number
}

interface Hover {
  month: number
  /** Position of the hovered month across the chart, 0..1. */
  ratio: number
}

function getTickStep(months: number): number {
  if (months > LONG_TERM_MONTHS) return 12
  if (months > MEDIUM_TERM_MONTHS) return 6
  return 3
}

function formatAxisMoney(amount: number): string {
  return amount === 0 ? '0' : formatMoneyShort(amount).replace(RUBLE_SUFFIX, '')
}

/** Total paid to the bank by each month, one line per variant; hover shows the amounts and the remaining debt. */
export function BalanceChart({ variants, sum }: BalanceChartProps) {
  const [hover, setHover] = useState<Hover | null>(null)

  const months = Math.max(...variants.map(({ loan }) => loan.schedule.length))
  const peak = Math.max(...variants.map(({ loan }) => loan.totalPayout)) * HEADROOM
  const plotWidth = WIDTH - PADDING.left - PADDING.right
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom
  const toX = (month: number) => PADDING.left + (month / months) * plotWidth
  const toY = (amount: number) => PADDING.top + (1 - amount / peak) * plotHeight

  const cheapest = variants.length > 1 ? variants.reduce((min, v) => (v.loan.totalPayout < min.loan.totalPayout ? v : min)) : null
  const ticks = Array.from({ length: Math.floor(months / getTickStep(months)) + 1 }, (_, index) => index * getTickStep(months))

  const handleMouseMove = (event: MouseEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - box.left) / box.width) * WIDTH
    const month = clamp(Math.round(((x - PADDING.left) / plotWidth) * months), 0, months)
    setHover({ month, ratio: toX(month) / WIDTH })
  }

  return (
    <div className={styles.chart}>
      <svg
        className={styles.chartSvg}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        role="img"
        aria-label="Накопленные выплаты по месяцам"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHover(null)}
      >
        {GRID_FRACTIONS.map((fraction) => (
          <g key={fraction}>
            <line x1={PADDING.left} x2={WIDTH - PADDING.right} y1={toY(peak * fraction)} y2={toY(peak * fraction)} className={styles.gridLine} />
            <text x={PADDING.left - 10} y={toY(peak * fraction) + 4} textAnchor="end" className={styles.axis}>
              {formatAxisMoney(peak * fraction)}
            </text>
          </g>
        ))}
        {ticks.map((month) => (
          <text key={month} x={toX(month)} y={HEIGHT - 8} textAnchor="middle" className={styles.axis}>
            {month === 0 ? 'Старт' : `${month} мес`}
          </text>
        ))}
        <line x1={PADDING.left} x2={toX(months)} y1={toY(sum)} y2={toY(sum)} stroke="var(--color-text-tertiary)" strokeDasharray="4 4" />
        <text x={PADDING.left + 6} y={toY(sum) - 8} className={styles.axis}>
          Сумма кредита {formatMoneyShort(sum)}
        </text>
        {variants.map(({ kind, loan, cumulativePayments }) => {
          const color = VARIANT_COLORS[kind]
          const termEnd = cumulativePayments.length - 1
          return (
            <g key={kind}>
              <polyline
                points={cumulativePayments.map((paid, month) => `${toX(month).toFixed(1)},${toY(paid).toFixed(1)}`).join(' ')}
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              <circle cx={toX(termEnd)} cy={toY(loan.totalPayout)} r="4" fill={color} />
              <text
                x={toX(termEnd) - 8}
                y={toY(loan.totalPayout) + (cheapest?.kind === kind ? 20 : -10)}
                textAnchor="end"
                className={styles.axis}
                style={{ fill: color, fontSize: 12 }}
              >
                {formatMoneyShort(loan.totalPayout)}
              </text>
            </g>
          )
        })}
        {hover && (
          <>
            <line x1={toX(hover.month)} x2={toX(hover.month)} y1={PADDING.top} y2={HEIGHT - PADDING.bottom} className={styles.hoverLine} />
            {variants.map(({ kind, cumulativePayments }) => {
              const month = Math.min(hover.month, cumulativePayments.length - 1)
              return <circle key={kind} cx={toX(month)} cy={toY(cumulativePayments[month])} r="5" fill={VARIANT_COLORS[kind]} />
            })}
          </>
        )}
      </svg>
      {hover && (
        <div
          className={styles.tooltip}
          style={
            hover.ratio > 0.5
              ? { right: `calc(${(1 - hover.ratio) * 100}% + ${TOOLTIP_GAP}px)` }
              : { left: `calc(${hover.ratio * 100}% + ${TOOLTIP_GAP}px)` }
          }
        >
          <b>{hover.month === 0 ? 'Выдача' : `${hover.month}-й месяц`}</b>
          {variants.map(({ kind, label, loan, cumulativePayments }) => {
            const month = Math.min(hover.month, cumulativePayments.length - 1)
            const debt = month === 0 ? sum : loan.schedule[month - 1].balance
            return (
              <span key={kind}>
                <VariantSwatch tone={kind} />
                {label}: выплачено {formatMoney(cumulativePayments[month])}, долг {formatMoney(debt)}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}
