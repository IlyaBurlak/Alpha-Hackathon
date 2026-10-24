import { observer } from 'mobx-react-lite'
import { useEffect, useRef } from 'react'

import type { Organization } from '@/entities/user'
import { Icon, ReadOnlyField, SelectField, TextAreaField, TextField, ToggleTags } from '@/shared/ui'
import type { SelectOption } from '@/shared/ui'

import type { ApplicationWizardStore } from '../../model/application-wizard-store'
import {
  APPLICANT_ROLES,
  COLLATERAL_OWNERS,
  COLLATERAL_TYPES,
  NOTE_MAX_LENGTH,
  POWER_OF_ATTORNEY_ROLE,
} from '../../model/wizard-form'
import type { ApplicantRole, CollateralOwner } from '../../model/wizard-form'
import { WizardSection } from '../section/WizardSection'
import styles from './DataStep.module.css'

const ROLE_OPTIONS: SelectOption[] = APPLICANT_ROLES.map((role) => ({ value: role, label: role }))
const OWNER_OPTIONS: SelectOption[] = COLLATERAL_OWNERS.map((owner) => ({ value: owner, label: owner }))
const COLLATERAL_TAGS = COLLATERAL_TYPES.map((type) => ({ value: type, label: type }))
const LOANS_ANSWERS = [
  { value: 'no', label: 'Нет' },
  { value: 'yes', label: 'Есть' },
] as const

function isApplicantRole(value: string): value is ApplicantRole {
  return APPLICANT_ROLES.some((role) => role === value)
}

function isCollateralOwner(value: string): value is CollateralOwner {
  return COLLATERAL_OWNERS.some((owner) => owner === value)
}

interface DataStepProps {
  store: ApplicationWizardStore
  organization: Organization
  applicantName: string
}

/** Step 2: the bank profile (read-only), the applicant contacts, finances, collateral and the purpose. */
export const DataStep = observer(function DataStep({ store, organization, applicantName }: DataStepProps) {
  const { form } = store
  const stepRef = useRef<HTMLDivElement>(null)
  const { invalidAttemptCount } = store

  // After a refused "Continue" the first problem comes into view and takes the focus.
  useEffect(() => {
    if (invalidAttemptCount === 0) return
    const firstInvalid = stepRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')
    firstInvalid?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    firstInvalid?.focus({ preventScroll: true })
  }, [invalidAttemptCount])

  return (
    <div ref={stepRef}>
      <div className={styles.legend}>
        <span>
          <Icon name="lock" size={16} />
          Из профиля банка, менять не нужно
        </span>
        <span>
          <Icon name="pen" size={16} />
          Проверьте или заполните
        </span>
      </div>

      <WizardSection title="Компания" source={{ icon: 'lock', text: 'ЕГРЮЛ и профиль банка' }} spacing="first">
        <div className={styles.grid}>
          <ReadOnlyField label="Название" value={organization.name} className={styles.full} />
          <ReadOnlyField label={organization.kpp ? 'ИНН / КПП' : 'ИНН'} value={organization.kpp ? `${organization.inn} / ${organization.kpp}` : organization.inn} />
          {organization.ogrn && <ReadOnlyField label={organization.type === 'sole-proprietor' ? 'ОГРНИП' : 'ОГРН'} value={organization.ogrn} />}
          {organization.head && <ReadOnlyField label="Руководитель" value={organization.head} />}
          {organization.account && <ReadOnlyField label="Счёт для зачисления" value={organization.account} />}
          {organization.address && <ReadOnlyField label="Адрес" value={organization.address} className={styles.full} />}
        </div>
      </WizardSection>

      <WizardSection title="Заявитель" source={{ icon: 'pen', text: 'Проверьте контакты' }}>
        <div className={styles.grid}>
          <ReadOnlyField label="ФИО" value={applicantName} />
          <SelectField
            label="Должность"
            value={form.role}
            options={ROLE_OPTIONS}
            onChange={(value) => isApplicantRole(value) && store.setRole(value)}
          />
          <TextField
            label="Телефон"
            value={form.phone}
            inputMode="tel"
            autoComplete="tel"
            placeholder="+7 900 000-00-00"
            hasDigitMask
            error={store.getIssue('phone')?.message}
            onChange={(value) => store.setPhone(value)}
            onBlur={() => store.touchField('phone')}
          />
          <TextField
            label="Эл. почта"
            value={form.email}
            inputMode="email"
            autoComplete="email"
            placeholder="name@company.ru"
            error={store.getIssue('email')?.message}
            onChange={(value) => store.setText('email', value)}
            onBlur={() => store.touchField('email')}
          />
        </div>
        {form.role === POWER_OF_ATTORNEY_ROLE && (
          <p className={styles.hint}>Банк попросит доверенность на этапе подписания.</p>
        )}
      </WizardSection>

      <WizardSection title="Финансы" source={{ icon: 'pen', text: 'Предзаполнено по оборотам, уточните' }}>
        <div className={styles.grid}>
          <TextField
            label="Выручка за 12 месяцев"
            suffix="₽"
            inputMode="numeric"
            hasDigitMask
            error={store.getIssue('revenue')?.message}
            onBlur={() => store.touchField('revenue')}
            value={form.revenue}
            onChange={(value) => store.setDigits('revenue', value)}
          />
          <TextField
            label="Сотрудников"
            inputMode="numeric"
            hasDigitMask
            value={form.employees}
            onChange={(value) => store.setDigits('employees', value)}
          />
        </div>
        <p className={styles.question}>Есть кредиты в других банках?</p>
        <div className={styles.answers}>
          <ToggleTags
            options={LOANS_ANSWERS}
            value={form.otherLoans}
            error={store.getIssue('otherLoans')?.message}
            onChange={(answer) => store.setOtherLoans(answer)}
          />
        </div>
        {form.otherLoans === 'yes' && (
          <div className={`${styles.grid} ${styles.followUp}`}>
            <TextField
              label="Платежи по ним в месяц"
              suffix="₽"
              inputMode="numeric"
              hasDigitMask
              error={store.getIssue('otherLoanPayments')?.message}
              onBlur={() => store.touchField('otherLoanPayments')}
              value={form.otherLoanPayments}
              onChange={(value) => store.setDigits('otherLoanPayments', value)}
            />
          </div>
        )}
        <p className={styles.hint}>
          Кредиты в нашем банке учтём сами. Данные других банков увидим только после вашего согласия на запрос в БКИ.
        </p>
      </WizardSection>

      {store.isSecured && (
        <WizardSection title="Залог" source={{ icon: 'pen', text: 'Заполните' }}>
          <ToggleTags
            options={COLLATERAL_TAGS}
            value={form.collateralType}
            error={store.getIssue('collateralType')?.message}
            onChange={(type) => store.setCollateralType(type)}
          />
          <div className={`${styles.grid} ${styles.followUp}`}>
            <TextField
              label="Примерная стоимость"
              suffix="₽"
              inputMode="numeric"
              hasDigitMask
              error={store.getIssue('collateralValue')?.message}
              onBlur={() => store.touchField('collateralValue')}
              value={form.collateralValue}
              onChange={(value) => store.setDigits('collateralValue', value)}
            />
            <SelectField
              label="Владелец"
              value={form.collateralOwner}
              options={OWNER_OPTIONS}
              onChange={(value) => isCollateralOwner(value) && store.setCollateralOwner(value)}
            />
          </div>
          <p className={styles.hint}>Оценку проведёт банк. Сейчас достаточно примерной стоимости.</p>
        </WizardSection>
      )}

      <WizardSection title="Цель кредита" source={{ text: 'Необязательно' }}>
        <TextAreaField
          label="Коротко, на что пойдут деньги"
          value={form.note}
          maxLength={NOTE_MAX_LENGTH}
          onChange={(value) => store.setText('note', value)}
        />
      </WizardSection>

    </div>
  )
})
