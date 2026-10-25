import { observer } from 'mobx-react-lite'
import { useState } from 'react'

import { useCurrentEmployee } from '@/entities/employee'
import { DECISION_OPTIONS } from '@/entities/staff-application'
import type { StaffApplication, StaffApplicationDetailStore, StaffApplicationListStore } from '@/entities/staff-application'
import { Button, Modal, useToast } from '@/shared/ui'

import { DecisionFormStore } from '../../model/decision-form-store'
import { DecisionForm } from '../decision-form/DecisionForm'
import { DecisionOptions } from '../decision-options/DecisionOptions'
import { RecommendationCard } from '../recommendation-card/RecommendationCard'
import styles from './DecisionFormPanel.module.css'

interface DecisionFormPanelProps {
  application: StaffApplication
  list: StaffApplicationListStore
  detail: StaffApplicationDetailStore
  /** Called with the text to tell the employee after the decision is saved. */
  onDecided: (message: string) => void
}

export const DecisionFormPanel = observer(function DecisionFormPanel({ application, list, detail, onDecided }: DecisionFormPanelProps) {
  const employee = useCurrentEmployee()
  const [store] = useState(() => new DecisionFormStore(application, list, detail))
  const { recommendation } = application
  const option = DECISION_OPTIONS[store.type]

  const showToast = useToast()

  // The confirmation closes on a failure, so the reason is told in a notice as well as under the form.
  const handleConfirm = async () => {
    if (await store.confirm({ id: employee.id, name: employee.name })) onDecided(option.historyTitle)
    else if (store.errorMessage) showToast(store.errorMessage)
  }

  return (
    <>
      {recommendation && <RecommendationCard recommendation={recommendation} />}
      <div className={styles.box}>
        <h3 className={styles.boxTitle}>Кредитное решение</h3>
        <DecisionOptions types={store.availableTypes} selected={store.type} recommended={recommendation?.type ?? null} onSelect={(type) => store.choose(type)} />
        <div className={styles.formSpace}>
          <DecisionForm store={store} />
        </div>
      </div>
      {store.isConfirming && (
        <Modal
          title={`${option.buttonLabel}?`}
          onClose={() => store.cancelConfirmation()}
          actions={
            <>
              <Button view="secondary" onClick={() => store.cancelConfirmation()}>
                Отмена
              </Button>
              <Button view={option.tone === 'negative' ? 'negative' : 'primary'} disabled={store.isSaving} onClick={() => void handleConfirm()}>
                {option.buttonLabel}
              </Button>
            </>
          }
        >
          <p className={styles.modalText}>
            Заявка №&nbsp;{application.number}, {application.company.name}. Клиент увидит решение в кредитном кабинете.
          </p>
        </Modal>
      )}
    </>
  )
})

