import { observer } from 'mobx-react-lite'

import { STAFF_STATUSES, getStaffCapabilities } from '@/entities/staff-application'
import type { StaffApplication } from '@/entities/staff-application'
import { Button, Modal, useToast } from '@/shared/ui'

import type { RestartScoringStore } from '../model/restart-scoring-store'

interface RestartScoringButtonProps {
  application: Pick<StaffApplication, 'id' | 'number' | 'status'>
  store: RestartScoringStore
}

/**
 * "Перезапустить скоринг": the backend allows it only while the application is under review, and a restart of a decided
 * one would stop its server, so the button is shown for the applications that are being scored or have just been scored.
 */
export const RestartScoringButton = observer(function RestartScoringButton({ application, store }: RestartScoringButtonProps) {
  const showToast = useToast()
  const isRestartable = application.status === STAFF_STATUSES.scoring || application.status === STAFF_STATUSES.ready
  if (!isRestartable || !getStaffCapabilities().canRestartScoring) return null

  const handleConfirm = async () => {
    if (await store.restart(application.id)) showToast('Скоринг перезапущен. Результат появится после обновления страницы')
    else if (store.errorMessage) showToast(store.errorMessage)
  }

  return (
    <>
      <Button view="secondary" size="small" disabled={store.isSaving} onClick={() => store.askConfirmation()}>
        Перезапустить скоринг
      </Button>
      {store.isConfirming && (
        <Modal
          title="Перезапустить скоринг?"
          onClose={() => store.cancelConfirmation()}
          actions={
            <>
              <Button view="secondary" onClick={() => store.cancelConfirmation()}>
                Отмена
              </Button>
              <Button disabled={store.isSaving} onClick={() => void handleConfirm()}>
                Перезапустить
              </Button>
            </>
          }
        >
          <p>
            Заявка №&nbsp;{application.number}: данные бюро и реестра запросятся заново, модель посчитает ещё раз. Прежние результаты
            скоринга будут заменены.
          </p>
        </Modal>
      )}
    </>
  )
})
