import type { StaffApplication } from '@/entities/staff-application'
import { calculateAnnuityPayment, formatMoney, formatMonths, formatPercent } from '@/shared/lib'

import { FigureTiles } from '../figure-tiles/FigureTiles'
import { KeyValueGrid } from '../key-value-grid/KeyValueGrid'
import { ReviewSection } from '../review-section/ReviewSection'

const UNKNOWN = '—'

interface ApplicationSectionProps {
  application: StaffApplication
}

/** What the client asked for, who asked, and the collateral. */
export function ApplicationSection({ application }: ApplicationSectionProps) {
  const { amount, termInMonths, scoring, product, applicant, collateral } = application
  const payment = scoring ? calculateAnnuityPayment(amount, scoring.rate, termInMonths) : null

  return (
    <ReviewSection id="s-app" title="Заявка" source="Кредитный кабинет клиента">
      <FigureTiles
        tiles={[
          { label: 'Сумма', value: formatMoney(amount) },
          { label: 'Срок', value: formatMonths(termInMonths) },
          { label: 'Ставка по модели', value: scoring ? formatPercent(scoring.rate) : UNKNOWN },
          { label: 'Платёж в месяц', value: payment === null ? UNKNOWN : formatMoney(payment) },
        ]}
      />
      <KeyValueGrid
        items={[
          { label: 'Продукт', value: product.name },
          { label: 'Цель', value: application.goal },
          { label: 'Заявитель', value: applicant.name },
          { label: 'Должность', value: applicant.role },
          { label: 'Телефон', value: applicant.phone },
          { label: 'Эл. почта', value: applicant.email },
          ...(collateral
            ? [
                { label: 'Залог', value: `${collateral.type}, ${formatMoney(collateral.value)}` },
                { label: 'Владелец залога', value: collateral.owner },
              ]
            : [
                { label: 'Залог', value: 'Без залога' },
                { label: 'Согласия', value: 'ПДн, БКИ, ОФД получены' },
              ]),
        ]}
      />
    </ReviewSection>
  )
}
