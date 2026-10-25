import { observer } from 'mobx-react-lite'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'

import { findEmployee } from '@/entities/employee'
import type { Employee } from '@/entities/employee'
import { STAFF_STATUSES, ScoreChip, SlaLabel, StaffStatusDot, formatMoment, useQueueViewStore } from '@/entities/staff-application'
import type { QueueSortKey, StaffApplication } from '@/entities/staff-application'
import { getStaffApplicationPath } from '@/shared/config'
import { classNames, formatMoney, formatMonths } from '@/shared/lib'
import { Avatar } from '@/shared/ui'

import { shortenName } from '../../lib/queue-text'
import styles from './QueueTable.module.css'

const MOMENT_SEPARATOR = ', '

interface Column {
  title: string
  sortKey?: QueueSortKey
  isNumeric?: boolean
}

const COLUMNS: readonly Column[] = [
  { title: 'Заявка', sortKey: 'number' },
  { title: 'Компания', sortKey: 'company' },
  { title: 'Сумма', sortKey: 'amount', isNumeric: true },
  { title: 'Поступила', sortKey: 'received' },
  { title: 'SLA', sortKey: 'sla' },
  { title: 'Балл', sortKey: 'score' },
  { title: 'Статус', sortKey: 'status' },
  { title: 'Ответственный' },
]

interface QueueTableProps {
  applications: readonly StaffApplication[]
  employee: Employee
  now: number
  /** The button that lets the employee take an application nobody works on. */
  renderTake: (application: StaffApplication) => ReactNode
}

function renderAssignee(application: StaffApplication, employee: Employee, renderTake: QueueTableProps['renderTake']) {
  const assignee = application.assigneeId ? findEmployee(application.assigneeId) : undefined
  if (assignee) {
    return (
      <span className={styles.who}>
        <Avatar initials={assignee.initials} shape="round" size="small" />
        {assignee.id === employee.id ? 'Вы' : shortenName(assignee.name)}
      </span>
    )
  }
  if (application.status === STAFF_STATUSES.scoring) return <span className={styles.nobody}>—</span>
  return renderTake(application)
}

/** The applications as a table: the columns that can be sorted show an arrow, a row opens the application. */
export const QueueTable = observer(function QueueTable({ applications, employee, now, renderTake }: QueueTableProps) {
  const view = useQueueViewStore()
  const navigate = useNavigate()

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {COLUMNS.map(({ title, sortKey, isNumeric }) => {
              const isSorted = sortKey !== undefined && view.sortKey === sortKey
              return (
                <th
                  key={title}
                  className={classNames(isNumeric && styles.right)}
                  aria-sort={isSorted ? (view.isDescending ? 'descending' : 'ascending') : sortKey ? 'none' : undefined}
                >
                  {sortKey ? (
                    <button type="button" className={styles.sort} onClick={() => view.sortBy(sortKey)}>
                      {title}
                      {isSorted && <span className={styles.arrow}>{view.isDescending ? '↓' : '↑'}</span>}
                    </button>
                  ) : (
                    title
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {applications.map((application) => {
            const [date, time] = formatMoment(application.receivedAt).split(MOMENT_SEPARATOR)
            return (
              <tr key={application.id} className={styles.row} onClick={() => void navigate(getStaffApplicationPath(application.id))}>
                <td className={styles.number}>
                  <Link className={styles.link} to={getStaffApplicationPath(application.id)} onClick={(event) => event.stopPropagation()}>
                    №&nbsp;{application.number}
                  </Link>
                </td>
                <td className={styles.company}>
                  <b>{application.company.name}</b>
                  <small>
                    ИНН {application.company.inn}, {application.product.shortName}
                  </small>
                </td>
                <td className={styles.right}>
                  <span className={styles.amount}>{formatMoney(application.amount)}</span>
                  <small className={styles.term}>{formatMonths(application.termInMonths)}</small>
                </td>
                <td className={styles.moment}>
                  {date}
                  {time && <small>{time}</small>}
                </td>
                <td>
                  <SlaLabel application={application} now={now} />
                </td>
                <td>
                  <ScoreChip score={application.scoring?.score ?? null} />
                </td>
                <td>
                  <StaffStatusDot status={application.status} />
                </td>
                <td onClick={(event) => event.stopPropagation()}>{renderAssignee(application, employee, renderTake)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
})
