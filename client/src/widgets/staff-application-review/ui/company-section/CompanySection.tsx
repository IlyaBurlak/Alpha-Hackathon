import type { StaffCompany } from '@/entities/staff-application'
import { formatLongDate, pluralize } from '@/shared/lib'
import { Icon } from '@/shared/ui'

import { KeyValueGrid } from '../key-value-grid/KeyValueGrid'
import { ReviewSection } from '../review-section/ReviewSection'

const DAYS_IN_YEAR = 365.25
const MS_IN_DAY = 86_400_000

interface CompanySectionProps {
  company: StaffCompany
  now: number
}

const NO_DATA = '—'

/** The bank profile and the state register data of the company. */
export function CompanySection({ company, now }: CompanySectionProps) {
  const { registeredAt, employeesCount, clientSince } = company
  const years = registeredAt === null ? null : Math.floor((now - registeredAt.getTime()) / (DAYS_IN_YEAR * MS_IN_DAY))

  return (
    <ReviewSection
      id="s-co"
      title="Компания"
      source={
        <>
          <Icon name="lock" size={14} />
          Банковский профиль и ЕГРЮЛ
        </>
      }
    >
      <KeyValueGrid
        items={[
          { label: 'ИНН', value: company.inn },
          company.kpp ? { label: 'КПП', value: company.kpp } : { label: 'ОГРНИП', value: company.ogrn },
          { label: 'ОГРН', value: company.ogrn },
          {
            label: 'Регистрация',
            value:
              registeredAt === null || years === null
                ? NO_DATA
                : `${formatLongDate(registeredAt)}, ${years} ${pluralize(years, ['год', 'года', 'лет'])}`,
          },
          { label: 'ОКВЭД', value: company.okved },
          { label: 'Сотрудников', value: employeesCount ?? NO_DATA },
          { label: 'Руководитель', value: company.head },
          { label: 'Клиент банка с', value: clientSince === null ? NO_DATA : `${clientSince} года` },
          { label: 'Адрес', value: company.address },
          { label: 'Расчётный счёт', value: company.account },
        ]}
      />
    </ReviewSection>
  )
}
