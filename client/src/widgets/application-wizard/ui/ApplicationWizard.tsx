import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { Link } from 'react-router'

import { CREDIT_GOALS, formatCreditTime } from '@/entities/application'
import type { Application, ProductOffer } from '@/entities/application'
import { ORGANIZATION_TYPES } from '@/entities/user'
import type { Organization } from '@/entities/user'
import { ChangeLoanParamsForm } from '@/features/create-application'
import { ROUTES } from '@/shared/config'
import { Button, EmptyState, Icon, TextButton } from '@/shared/ui'
import { formatMoney } from '@/shared/lib'

import { ApplicationWizardStore } from '../model/application-wizard-store'
import type { WizardStep } from '../model/application-wizard-store'
import type { WizardDefaults } from '../model/wizard-form'
import { DataStep } from './data-step/DataStep'
import { ReviewStep } from './review-step/ReviewStep'
import { VariantStep } from './variants/VariantStep'
import styles from './ApplicationWizard.module.css'
import { WizardStepper } from './stepper/WizardStepper'

const STEP_TITLES: Record<WizardStep, string> = {
  1: 'Выберите вариант',
  2: 'Заполните и проверьте данные',
  3: 'Проверьте и отправьте',
}

interface ApplicationWizardProps {
  application: Application
  /** Products the bank offers for this draft. */
  offers: readonly ProductOffer[]
  organization: Organization
  applicantName: string
  /** Known facts about the applicant that prefill the data step. */
  defaults: WizardDefaults
  onSubmitted: (application: Application) => void
  onDiscard: () => void
  /** The user changed the loan parameters: the new application replaces this draft. */
  onParamsChanged: (application: Application) => void
  onApplySuggestedSum: (sum: number) => void
}

/** The three-step flow of a draft: choose a variant, check the data, confirm and send it to the bank. */
export const ApplicationWizard = observer(function ApplicationWizard({
  application,
  offers,
  organization,
  applicantName,
  defaults,
  onSubmitted,
  onDiscard,
  onParamsChanged,
  onApplySuggestedSum,
}: ApplicationWizardProps) {
  const [store] = useState(() => new ApplicationWizardStore(application, offers, defaults))
  const goal = CREDIT_GOALS.find(({ id }) => id === application.goal)
  const { selectedOffer } = store

  const handleSubmit = async () => {
    const sent = await store.submit()
    if (sent) onSubmitted(sent)
  }

  return (
    <>
      <Link className={styles.crumb} to={ROUTES.cabinet}>
        <Icon name="left" size={18} />
        Главная
      </Link>
      <div className={styles.header}>
        <div>
          <h1>{STEP_TITLES[store.step]}</h1>
          <div className={styles.params}>
            {goal && <b>{goal.shortLabel}</b>}
            <span>
              {formatMoney(application.sum)} на {formatCreditTime(application.creditTime)}
            </span>
            {store.step === 1 && (
              <TextButton onClick={() => store.toggleParamsEditing()}>
                {store.isEditingParams ? 'Свернуть' : 'Изменить'}
              </TextButton>
            )}
          </div>
        </div>
        <Button view="ghost" size="small" onClick={onDiscard}>
          Удалить черновик
        </Button>
      </div>
      <WizardStepper currentStep={store.step} canGoToStep={(step) => store.canGoToStep(step)} onGoToStep={(step) => store.goToStep(step)} />

      {store.step === 1 && store.isEditingParams && (
        <ChangeLoanParamsForm
          application={application}
          isLegalEntity={organization.type === ORGANIZATION_TYPES.legalEntity}
          onCreated={onParamsChanged}
        />
      )}

      {store.step === 1 &&
        (store.variants.offers.length === 0 ? (
          <EmptyState title="Подходящих продуктов нет" text="Для этой суммы и срока банк ничего не предлагает. Попробуйте изменить условия." />
        ) : (
          <VariantStep
            variants={store.variants}
            organizationId={application.organizationId}
            sum={application.sum}
            selectedOfferId={store.selectedOfferId}
            comparisonTab={store.comparisonTab}
            isScheduleExpanded={store.isScheduleExpanded}
            onPick={(offerId) => store.pickOffer(offerId)}
            onComparisonTabChange={(tab) => store.setComparisonTab(tab)}
            onToggleScheduleExpanded={() => store.toggleScheduleExpanded()}
            onApplySuggestedSum={onApplySuggestedSum}
          />
        ))}

      {store.step === 2 && (
        <>
          <DataStep store={store} organization={organization} applicantName={applicantName} />
          <div className={styles.footer}>
            <Button view="secondary" onClick={() => store.goBack()}>
              Назад
            </Button>
            <span className={styles.footerSpacer} />
            <Button size="large" onClick={() => store.goNext()}>
              Продолжить
            </Button>
          </div>
        </>
      )}

      {store.step === 3 && selectedOffer && (
        <>
          <ReviewStep store={store} offer={selectedOffer} organizationName={organization.name} applicantName={applicantName} />
          {store.errorMessage && (
            <p className={styles.error} role="alert">
              {store.errorMessage}
            </p>
          )}
          <div className={styles.footer}>
            <Button view="secondary" onClick={() => store.goBack()}>
              Назад
            </Button>
            <span className={styles.footerSpacer} />
            <Button view="accent" size="large" disabled={!store.areAllConsentsGiven || store.isSubmitting} onClick={() => void handleSubmit()}>
              Отправить в банк
            </Button>
          </div>
        </>
      )}
    </>
  )
})
