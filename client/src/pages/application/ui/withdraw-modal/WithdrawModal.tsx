import { Button, Modal } from '@/shared/ui'

import styles from './WithdrawModal.module.css'

interface WithdrawModalProps {
  onClose: () => void
  onConfirm: () => void
}

export function WithdrawModal({ onClose, onConfirm }: WithdrawModalProps) {
  return (
    <Modal
      title="Отозвать заявку?"
      onClose={onClose}
      actions={
        <>
          <Button view="secondary" onClick={onClose}>
            Оставить
          </Button>
          <Button onClick={onConfirm}>Отозвать</Button>
        </>
      }
    >
      <p className={styles.text}>Рассмотрение остановится.</p>
    </Modal>
  )
}
