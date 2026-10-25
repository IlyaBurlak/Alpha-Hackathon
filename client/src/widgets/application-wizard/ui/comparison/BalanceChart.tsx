import { useState } from 'react'
import type { MouseEvent } from 'react'

import { clamp, formatMoney, formatMoneyShort } from '@/shared/lib'

import type { ComparedVariant, VariantTone } from '../../lib/comparison'
import styles from './BalanceChart.module.css'
import { VariantSwatch } from './swatch/VariantSwatch'

const WIDTH = 760
const HEIGHT = 320
const PADDING = { left: 64, right: 120, top: 16, bottom: 34 }
const LABEL_GAP = 34
const HEADROOM = 1.04
const GRID_FRACTIONS = [0, 0.25, 0.5, 0.75, 1]
const LONG_TERM_MONTHS = 36
const MEDIUM_TERM_MONTHS = 12
const TOOLTIP_GAP = 16
const RUBLE_SUFFIX = / ₽$/

const VARIANT_COLORS: Record<VariantTone, string> = {
  first: 'var(--color-text)',
  second: 'var(--color-red)',
  third: 'var(--color-link)',
  fourth: 'var(--color-positive)',
}

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

/** End labels of the lines pushed apart so that close totals do not overlap. */
function spreadLabels(positions: readonly number[]): number[] {
  const order = positions.map((_, index) => index).sort((first, second) => positions[first] - positions[second])
  const spread = [...positions]
  order.forEach((index, rank) => {
    if (rank > 0) spread[index] = Math.max(positions[index], spread[order[rank - 1]] + LABEL_GAP)
  })
  return spread
}

function formatAxisMoney(amount: number): string {
  return amount === 0 ? '0' : formatMoneyShort(amount).replace(RUBLE_SUFFIX, '')
}

/** Interest paid to the bank by each month, one line per variant: the gap between the lines is the price of choosing the pricier offer. */
export function BalanceChart({ variants, sum }: BalanceChartProps) {
  const [hover, setHover] = useState<Hover | null>(null)

  const months = Math.max(...variants.map(({ loan }) => loan.schedule.length))
  const peak = Math.max(...variants.map(({ loan }) => loan.totalInterest)) * HEADROOM
  const plotWidth = WIDTH - PADDING.left - PADDING.right
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom
  const toX = (month: number) => PADDING.left + (month / months) * plotWidth
  const toY = (amount: number) => PADDING.top + (1 - amount / peak) * plotHeight

  const labelYs = spreadLabels(variants.map(({ loan }) => toY(loan.totalInterest)))
  const ticks = Array.from({ length: Math.floor(months / getTickStep(months)) + 1 }, (_, index) => index * getTickStep(months))

  const handleMouseMove = (event: MouseEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - box.left) / box.width) * WIDTH
    const month = clamp(Math.round(((x - PADDING.left) / plotWidth) * months), 0, months)
    setHover({ month, ratio: toX(month) / WIDTH })
  }

  const getInterestAt = ({ loan }: ComparedVariant, month: number) =>
    loan.schedule.slice(0, Math.min(month, loan.schedule.length)).reduce((total, row) => total + row.interest, 0)

  return (
    <div className={styles.chart}>
      <div className={styles.inner}>
        <svg
          className={styles.chartSvg}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          width="100%"
          role="img"
          aria-label="Накопленная переплата по месяцам"
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
          {variants.map((variant, index) => {
            const { id, tone, loan } = variant
            const color = VARIANT_COLORS[tone]
            const termEnd = loan.schedule.length
            return (
              <g key={id}>
                <polyline
                  points={Array.from(
                    { length: termEnd + 1 },
                    (_, month) => `${toX(month).toFixed(1)},${toY(getInterestAt(variant, month)).toFixed(1)}`,
                  ).join(' ')}
                  fill="none"
                  stroke={color}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx={toX(termEnd)} cy={toY(loan.totalInterest)} r="5" fill={color} />
                <text x={toX(termEnd) + 12} y={labelYs[index] + 4} className={styles.endLabel} style={{ fill: color }}>
                  {formatMoneyShort(loan.totalInterest)}
                </text>
                <text x={toX(termEnd) + 12} y={labelYs[index] + 19} className={styles.endNote}>
                  платёж {formatMoneyShort(loan.monthlyPayment)}
                </text>
              </g>
            )
          })}
          {hover && (
            <>
              <line x1={toX(hover.month)} x2={toX(hover.month)} y1={PADDING.top} y2={HEIGHT - PADDING.bottom} className={styles.hoverLine} />
              {variants.map((variant) => (
                <circle
                  key={variant.id}
                  cx={toX(Math.min(hover.month, variant.loan.schedule.length))}
                  cy={toY(getInterestAt(variant, hover.month))}
                  r="5"
                  fill={VARIANT_COLORS[variant.tone]}
                />
              ))}
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
            {[...variants]
              .sort((first, second) => getInterestAt(first, hover.month) - getInterestAt(second, hover.month))
              .map((variant) => {
                const { id, tone, label, loan } = variant
                const month = Math.min(hover.month, loan.schedule.length)
                const debt = month === 0 ? sum : loan.schedule[month - 1].balance
                return (
                  <span key={id} className={styles.tooltipRow}>
                    <b className={styles.tooltipName}>
                      <VariantSwatch tone={tone} />
                      {label}
                    </b>
                    <small>
                      переплата {formatMoney(getInterestAt(variant, hover.month))}, долг {formatMoney(debt)}
                    </small>
                  </span>
                )
              })}
          </div>
        )}
      </div>
    </div>
  )
}
