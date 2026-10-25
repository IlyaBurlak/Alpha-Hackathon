import { observer } from 'mobx-react-lite'

import { findEmployee, getEmployees } from '@/entities/employee'
import type { Employee } from '@/entities/employee'
import { Avatar, Icon, MenuItem, Popover } from '@/shared/ui'

import type { AssignmentStore } from '../model/assignment-store'
import triggerStyles from './AssigneeMenu.module.css'

const ASSIGN_TO_SELF_TITLE = 'Назначить на себя'

interface AssigneeMenuProps {
  applicationId: string
  assigneeId: string | null
  currentEmployee: Employee
  store: AssignmentStore
  /** Called with the text to tell the employee after a change. */
  onChanged: (message: string) => void
}

/** The button in the header of an application: who is responsible, and a menu to hand it over. */
export const AssigneeMenu = observer(function AssigneeMenu({
  applicationId,
  assigneeId,
  currentEmployee,
  store,
  onChanged,
}: AssigneeMenuProps) {
  const assignee = assigneeId ? findEmployee(assigneeId) : undefined
  const triggerLabel = assignee ? (assignee.id === currentEmployee.id ? 'Вы ответственный' : assignee.name) : 'Не назначен'

  const assign = async (employee: Employee | null, close: () => void) => {
    close()
    if (await store.assign(applicationId, employee)) {
      onChanged(employee ? 'Ответственный назначен' : 'Ответственный снят')
    }
  }

  return (
    <Popover
      label="Ответственный"
      size="compact"
      renderTrigger={(triggerProps) => (
        <button type="button" className={triggerStyles.trigger} {...triggerProps}>
          <Avatar initials={assignee?.initials ?? '?'} shape="round" size="small" />
          {triggerLabel}
          <Icon name="updown" size={16} />
        </button>
      )}
    >
      {(close) => (
        <>
          {getEmployees().map((employee) => (
            <MenuItem
              key={employee.id}
              size="compact"
              title={employee.id === currentEmployee.id ? ASSIGN_TO_SELF_TITLE : employee.name}
              description={employee.position}
              leading={<Avatar initials={employee.initials} shape="round" size="small" />}
              trailing={assigneeId === employee.id ? <Icon name="check" size={18} /> : null}
              onClick={() => void assign(employee, close)}
            />
          ))}
          {assigneeId && <MenuItem size="compact" title="Снять ответственного" onClick={() => void assign(null, close)} />}
        </>
      )}
    </Popover>
  )
})
