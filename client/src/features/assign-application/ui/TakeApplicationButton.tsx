import { observer } from 'mobx-react-lite'

import type { Employee } from '@/entities/employee'
import { Button } from '@/shared/ui'

import type { AssignmentStore } from '../model/assignment-store'

interface TakeApplicationButtonProps {
  applicationId: string
  employee: Employee
  store: AssignmentStore
  /** Called after the application is taken. */
  onTaken: () => void
}

/** "Взять": the employee makes themselves responsible for an application nobody works on. */
export const TakeApplicationButton = observer(function TakeApplicationButton({
  applicationId,
  employee,
  store,
  onTaken,
}: TakeApplicationButtonProps) {
  const handleClick = async () => {
    if (await store.assign(applicationId, employee)) onTaken()
  }

  return (
    <Button view="secondary" size="small" disabled={store.isSaving} onClick={() => void handleClick()}>
      Взять
    </Button>
  )
})
