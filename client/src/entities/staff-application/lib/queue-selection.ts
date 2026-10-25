import { getSla } from './sla'
import { STAFF_STATUSES } from '../model/types'
import type { StaffApplication, StaffStatus } from '../model/types'

const MS_IN_DAY = 86_400_000

/** The three lists of the staff cabinet: the open queue, the open applications of the employee, the answered ones. */
export type QueueMode = 'queue' | 'mine' | 'done'

export type QueueFilter = 'work' | 'ready' | 'scoring' | 'clarify' | 'all'
export type QueueSortKey = 'number' | 'company' | 'amount' | 'received' | 'sla' | 'score' | 'status'

export const QUEUE_FILTERS: ReadonlyArray<{ value: QueueFilter; label: string; matches: (application: StaffApplication) => boolean }> = [
  { value: 'work', label: 'В работе', matches: ({ status }) => IN_WORK.includes(status) },
  { value: 'ready', label: 'Ждут решения', matches: ({ status }) => status === STAFF_STATUSES.ready },
  { value: 'scoring', label: 'На скоринге', matches: ({ status }) => status === STAFF_STATUSES.scoring },
  { value: 'clarify', label: 'На уточнении', matches: ({ status }) => status === STAFF_STATUSES.clarify || status === STAFF_STATUSES.offer },
  { value: 'all', label: 'Все', matches: () => true },
]

const IN_WORK: readonly StaffStatus[] = [STAFF_STATUSES.ready, STAFF_STATUSES.scoring, STAFF_STATUSES.clarify, STAFF_STATUSES.offer]
const WITHOUT_FINAL_DECISION: readonly StaffStatus[] = [STAFF_STATUSES.ready, STAFF_STATUSES.clarify, STAFF_STATUSES.offer]
const ANSWERED: readonly StaffStatus[] = [STAFF_STATUSES.approved, STAFF_STATUSES.rejected]
const WAITING_FOR_DECISION: readonly StaffStatus[] = [STAFF_STATUSES.ready, STAFF_STATUSES.scoring]

export interface QueueQuery {
  mode: QueueMode
  filter: QueueFilter
  /** Only applications where the employee is responsible; used on the queue list. */
  onlyMine: boolean
  query: string
  sortKey: QueueSortKey
  /** 1 or -1; for the "received" column 1 means newest first. */
  direction: 1 | -1
  employeeId: string
  now: number
}

/**
 * Applications of the mode before the status filter. An answered application leaves the queue and "mine" for good
 * and is found in "done" only.
 */
export function selectModeApplications(applications: readonly StaffApplication[], mode: QueueMode, employeeId: string): StaffApplication[] {
  if (mode === 'done') return applications.filter(({ status }) => ANSWERED.includes(status))
  const open = applications.filter(({ status }) => !ANSWERED.includes(status))
  return mode === 'mine' ? open.filter((application) => application.assigneeId === employeeId) : open
}

export function countByFilter(applications: readonly StaffApplication[], filter: QueueFilter): number {
  const rule = QUEUE_FILTERS.find((candidate) => candidate.value === filter)
  return rule ? applications.filter(rule.matches).length : 0
}

/** Columns with a text or a number that read naturally from the smallest or the first letter. */
export const ASCENDING_FIRST_SORT_KEYS: readonly QueueSortKey[] = ['number', 'company', 'status']

/** The statuses in the order an application goes through them: scoring first, answered last. */
const STATUS_ORDER: readonly StaffStatus[] = [
  STAFF_STATUSES.scoring,
  STAFF_STATUSES.ready,
  STAFF_STATUSES.clarify,
  STAFF_STATUSES.offer,
  STAFF_STATUSES.approved,
  STAFF_STATUSES.rejected,
]

function compareText(first: string, second: string): number {
  return first.localeCompare(second, 'ru')
}

function getSortValue(application: StaffApplication, key: QueueSortKey, now: number): number {
  if (key === 'number') return Number(application.number)
  if (key === 'status') return STATUS_ORDER.indexOf(application.status)
  if (key === 'amount') return application.amount
  if (key === 'sla') return getSla(application, now)?.progress ?? -1
  if (key === 'score') return application.scoring?.score ?? -1
  return application.receivedAt.getTime()
}

/** The rows of the table after the filter, the search and the sorting. */
export function selectQueueRows(applications: readonly StaffApplication[], options: QueueQuery): StaffApplication[] {
  const { mode, filter, onlyMine, query, sortKey, direction, employeeId, now } = options
  const modeApplications = selectModeApplications(applications, mode, employeeId)
  const rule = QUEUE_FILTERS.find((candidate) => candidate.value === filter)
  const filtered = mode === 'done' || !rule ? modeApplications : modeApplications.filter(rule.matches)
  const needle = query.trim().toLowerCase()
  const searched = needle
    ? filtered.filter((application) => [application.number, application.company.name, application.company.inn].join(' ').toLowerCase().includes(needle))
    : filtered
  const owned = onlyMine && mode === 'queue' ? searched.filter((application) => application.assigneeId === employeeId) : searched
  const sign = sortKey === 'received' ? -direction : direction
  return [...owned].sort((first, second) => {
    const difference =
      sortKey === 'company'
        ? compareText(first.company.name, second.company.name)
        : getSortValue(first, sortKey, now) - getSortValue(second, sortKey, now)
    return difference * sign
  })
}

export interface QueueSummary {
  receivedToday: number
  total: number
  waitingForDecision: number
  inWorkByEmployee: number
  overdue: number
}

/** The four numbers above the queue. */
export function summarizeQueue(applications: readonly StaffApplication[], employeeId: string, now: number): QueueSummary {
  return {
    receivedToday: applications.filter(({ receivedAt }) => now - receivedAt.getTime() < MS_IN_DAY).length,
    total: applications.length,
    waitingForDecision: applications.filter(({ status }) => status === STAFF_STATUSES.ready).length,
    inWorkByEmployee: applications.filter(({ assigneeId, status }) => assigneeId === employeeId && WITHOUT_FINAL_DECISION.includes(status)).length,
    overdue: applications.filter((application) => getSla(application, now)?.isOverdue === true).length,
  }
}

/** Numbers next to the menu items: how many applications wait in the queue, and how many are the employee's. */
export function countNavigation(applications: readonly StaffApplication[], employeeId: string): { queue: number; mine: number } {
  return {
    queue: applications.filter(({ status }) => WAITING_FOR_DECISION.includes(status)).length,
    mine: applications.filter(({ assigneeId, status }) => assigneeId === employeeId && !ANSWERED.includes(status)).length,
  }
}
