import { useState } from 'react'

import { formatCreditTime, formatMoney, formatPercent } from '@/entities/application'
import type { Application } from '@/entities/application'
import { Button, Checkbox, Icon, Modal } from '@/shared/ui'

import styles from './SignModal.module.css'

const CONTRACT_DOCUMENTS = ['Кредитный договор', 'График платежей'] as const

interface SignModalProps {
  application: Application
  onClose: () => void
  onConfirm: () => void
}

export function SignModal({ application, onClose, onConfirm }: SignModalProps) {
  const [isAgreed, setIsAgreed] = useState(false)
  const { productChoice } = application
  const terms = `${formatMoney(application.sum)} на ${formatCreditTime(application.creditTime)}`

  return (
    <Modal
      title="Подписание договора"
      onClose={onClose}
      actions={
        <>
          <Button view="secondary" onClick={onClose}>
            Отмена
          </Button>
          <Button view="accent" disabled={!isAgreed} onClick={onConfirm}>
            Подписать
          </Button>
        </>
      }
    >
      <p className={styles.modalText}>
        {productChoice.kind === 'selected' ? `${terms} под ${formatPercent(productChoice.product.interestRate)}` : terms}
      </p>
      <ul className={styles.documents}>
        {CONTRACT_DOCUMENTS.map((document) => (
          <li key={document}>
            <Icon name="document" size={20} />
            {document}
          </li>
        ))}
      </ul>
      <Checkbox
        label="Ознакомился с условиями и подписываю документы простой электронной подписью"
        isChecked={isAgreed}
        onChange={setIsAgreed}
      />
    </Modal>
  )
}
