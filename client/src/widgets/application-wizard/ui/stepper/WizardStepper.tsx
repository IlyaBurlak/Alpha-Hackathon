import { classNames } from '@/shared/lib'
import { Icon } from '@/shared/ui'

import type { WizardStep } from '../../model/application-wizard-store'
import styles from './WizardStepper.module.css'

const STEPS: ReadonlyArray<{ step: WizardStep; title: string }> = [
  { step: 1, title: 'Вариант' },
  { step: 2, title: 'Данные' },
  { step: 3, title: 'Отправка' },
]

interface WizardStepperProps {
  currentStep: WizardStep
  canGoToStep: (step: WizardStep) => boolean
  onGoToStep: (step: WizardStep) => void
}

export function WizardStepper({ currentStep, canGoToStep, onGoToStep }: WizardStepperProps) {
  return (
    <nav aria-label="Шаги заявки">
      <ol className={styles.stepper}>
        {STEPS.map(({ step, title }) => {
          const isReachable = canGoToStep(step)
          const className = classNames(
            styles.step,
            step <= currentStep && styles.stepActive,
            step === currentStep && styles.stepCurrent,
            isReachable && styles.stepReachable,
          )
          const content = (
            <>
              <i className={styles.stepBar} />
              <span className={styles.stepLabel}>
                {(step < currentStep || isReachable) && <Icon name="check" size={14} />}
                {step}. {title}
              </span>
            </>
          )
          return (
            <li key={step} className={styles.stepItem}>
              {isReachable ? (
                <button type="button" className={className} onClick={() => onGoToStep(step)}>
                  {content}
                </button>
              ) : (
                <div className={className} aria-current={step === currentStep ? 'step' : undefined}>
                  {content}
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
