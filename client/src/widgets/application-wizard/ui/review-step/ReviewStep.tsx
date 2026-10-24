import { observer } from 'mobx-react-lite'

import { calculateLoan, formatCreditTime, formatMoney, formatPercent } from '@/entities/application'
import type { ProductOffer } from '@/entities/application'
import { Checkbox, TextButton } from '@/shared/ui'

import type { ApplicationWizardStore } from '../../model/application-wizard-store'
import { CONSENTS } from '../../model/wizard-form'
import { parseDigits } from '../../model/wizard-validation'
import { WizardSection } from '../section/WizardSection'
import styles from './ReviewStep.module.css'
import { ReviewGroup } from './ReviewGroup'

interface ReviewStepProps {
  store: ApplicationWizardStore
  offer: ProductOffer
  organizationName: string
  applicantName: string
}

/** Step 3: everything the user entered, the consents and the final send. */
export const ReviewStep = observer(function ReviewStep({ store, offer, organizationName, applicantName }: ReviewStepProps) {
  const { form } = store
  const { monthlyPayment } = calculateLoan(offer)
  const otherLoans = form.otherLoans === 'yes' ? `${formatMoney(parseDigits(form.otherLoanPayments))} в месяц` : 'Нет'

  return (
    <>
      <div className={styles.review}>
        <ReviewGroup
          title="Кредит"
          step={1}
          onEdit={(step) => store.goToStep(step)}
          items={[
            { label: 'Продукт', value: offer.name },
            { label: 'Сумма', value: formatMoney(offer.sum) },
            { label: 'Срок', value: formatCreditTime(offer.creditTime) },
            { label: 'Ставка', value: formatPercent(offer.interestRate) },
            { label: 'Платёж в месяц', value: formatMoney(monthlyPayment) },
          ]}
        />
        <ReviewGroup
          title="Компания и заявитель"
          step={2}
          onEdit={(step) => store.goToStep(step)}
          items={[
            { label: 'Компания', value: organizationName },
            { label: 'Заявитель', value: `${applicantName}, ${form.role.toLowerCase()}` },
            { label: 'Телефон', value: form.phone },
            { label: 'Эл. почта', value: form.email },
          ]}
        />
        <ReviewGroup
          title="Финансы"
          step={2}
          onEdit={(step) => store.goToStep(step)}
          items={[
            { label: 'Выручка за 12 месяцев', value: formatMoney(parseDigits(form.revenue)) },
            { label: 'Сотрудников', value: form.employees || '—' },
            { label: 'Кредиты в других банках', value: otherLoans },
          ]}
        />
        {store.isSecured && (
          <ReviewGroup
            title="Залог"
            step={2}
            onEdit={(step) => store.goToStep(step)}
            items={[
              { label: 'Тип', value: form.collateralType ?? '—' },
              { label: 'Стоимость', value: formatMoney(parseDigits(form.collateralValue)) },
              { label: 'Владелец', value: form.collateralOwner },
            ]}
          />
        )}
      </div>
      <WizardSection
        title="Согласия"
        spacing="compact"
        action={
          <TextButton onClick={() => store.toggleAllConsents()}>
            {store.areAllConsentsGiven ? 'Снять все' : 'Отметить все'}
          </TextButton>
        }
      >
        {CONSENTS.map(({ key, title, description }) => (
          <Checkbox
            key={key}
            label={title}
            description={description}
            isChecked={form.consents[key]}
            onChange={(isGiven) => store.setConsent(key, isGiven)}
          />
        ))}
      </WizardSection>
    </>
  )
})
