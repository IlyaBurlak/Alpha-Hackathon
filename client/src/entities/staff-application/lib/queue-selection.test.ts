import { describe, expect, it } from 'vitest'

import type { StaffApplication, StaffStatus } from '../model/types'
import { countByFilter, countNavigation, selectModeApplications, selectQueueRows, summarizeQueue } from './queue-selection'
import type { QueueQuery } from './queue-selection'

const HOUR = 3_600_000
const NOW = new Date('2026-10-24T12:00:00Z').getTime()

interface Draft {
  number: string
  status: StaffStatus
  assigneeId?: string | null
  hoursAgo?: number
  amount?: number
  score?: number | null
  name?: string
  inn?: string
}

function createApplication({ number, status, assigneeId = null, hoursAgo = 1, amount = 1_000_000, score = 70, name = 'ООО «Тест»', inn = '7700000000' }: Draft): StaffApplication {
  return {
    id: `a${number}`,
    number,
    receivedAt: new Date(NOW - hoursAgo * HOUR),
    status,
    assigneeId,
    amount,
    company: { name, inn },
    scoring: score === null ? null : { score },
  } as StaffApplication
}

const APPLICATIONS = [
  createApplication({ number: '1', status: 'scoring', hoursAgo: 0.1, score: null, amount: 12e6 }),
  createApplication({ number: '2', status: 'ready', assigneeId: 'u1', hoursAgo: 5, amount: 3e6, score: 95, name: 'ООО «Колос и Ко»', inn: '7714825631' }),
  createApplication({ number: '3', status: 'ready', hoursAgo: 30, amount: 20e6, score: 33 }),
  createApplication({ number: '4', status: 'clarify', assigneeId: 'u1', hoursAgo: 12, score: 60 }),
  createApplication({ number: '5', status: 'offer', assigneeId: 'u2', hoursAgo: 8 }),
  createApplication({ number: '6', status: 'approved', assigneeId: 'u1', hoursAgo: 50, score: 85 }),
  createApplication({ number: '7', status: 'rejected', assigneeId: 'u2', hoursAgo: 40, score: 20 }),
]

const QUERY: QueueQuery = { mode: 'queue', filter: 'work', onlyMine: false, query: '', sortKey: 'received', direction: 1, employeeId: 'u1', now: NOW }

function numbers(applications: readonly StaffApplication[]): string[] {
  return applications.map(({ number }) => number)
}

describe('selectQueueRows: filters', () => {
  it('"in work" leaves out the answered applications', () => {
    expect(numbers(selectQueueRows(APPLICATIONS, QUERY))).toEqual(['1', '2', '5', '4', '3'])
  })

  it.each([
    ['ready', ['2', '3']],
    ['scoring', ['1']],
    ['clarify', ['5', '4']],
    ['all', ['1', '2', '5', '4', '3']],
  ] as const)('"%s" shows the matching applications, the newest first', (filter, expected) => {
    expect(numbers(selectQueueRows(APPLICATIONS, { ...QUERY, filter }))).toEqual(expected)
  })

  it('"only mine" keeps the applications of the employee on the queue', () => {
    expect(numbers(selectQueueRows(APPLICATIONS, { ...QUERY, onlyMine: true }))).toEqual(['2', '4'])
  })

  it('the "mine" list holds the open applications of the employee; the answered ones moved to "done"', () => {
    expect(numbers(selectQueueRows(APPLICATIONS, { ...QUERY, mode: 'mine', filter: 'all' }))).toEqual(['2', '4'])
  })

  it('an answered application is not in any list of the queue, even "all", and shows up in "done" only', () => {
    expect(numbers(selectQueueRows(APPLICATIONS, { ...QUERY, filter: 'all' }))).not.toContain('6')
    expect(numbers(selectQueueRows(APPLICATIONS, { ...QUERY, filter: 'all', sortKey: 'status' }))).not.toContain('7')
    expect(numbers(selectQueueRows(APPLICATIONS, { ...QUERY, mode: 'done', query: 'Колос' }))).toEqual([])
  })

  it('the "done" list holds the answered applications and ignores the filter', () => {
    expect(numbers(selectQueueRows(APPLICATIONS, { ...QUERY, mode: 'done', filter: 'scoring' }))).toEqual(['7', '6'])
  })
})

describe('selectQueueRows: search and sorting', () => {
  it('searches by number, company name and INN in any letter case', () => {
    expect(numbers(selectQueueRows(APPLICATIONS, { ...QUERY, query: 'КОЛОС' }))).toEqual(['2'])
    expect(numbers(selectQueueRows(APPLICATIONS, { ...QUERY, query: '7714825631' }))).toEqual(['2'])
    expect(numbers(selectQueueRows(APPLICATIONS, { ...QUERY, query: ' 5 ', filter: 'all' }))).toEqual(['2', '5'])
    expect(selectQueueRows(APPLICATIONS, { ...QUERY, query: 'нет такой' })).toEqual([])
  })

  it('sorts by the amount, the biggest first for the natural order', () => {
    expect(numbers(selectQueueRows(APPLICATIONS, { ...QUERY, sortKey: 'amount', direction: -1 }))).toEqual(['3', '1', '2', '4', '5'])
  })

  it('sorts by the application number, the smallest first for the natural order', () => {
    expect(numbers(selectQueueRows(APPLICATIONS, { ...QUERY, sortKey: 'number', direction: 1 }))).toEqual(['1', '2', '3', '4', '5'])
    expect(numbers(selectQueueRows(APPLICATIONS, { ...QUERY, sortKey: 'number', direction: -1 }))).toEqual(['5', '4', '3', '2', '1'])
  })

  it('sorts by the company name in the Russian alphabet', () => {
    const named = [
      createApplication({ number: '1', status: 'ready', name: 'ООО «Эко»' }),
      createApplication({ number: '2', status: 'ready', name: 'ООО «Арт-Мебель»' }),
      createApplication({ number: '3', status: 'ready', name: 'ИП Ёлкин' }),
    ]

    expect(numbers(selectQueueRows(named, { ...QUERY, sortKey: 'company', direction: 1 }))).toEqual(['3', '2', '1'])
    expect(numbers(selectQueueRows(named, { ...QUERY, sortKey: 'company', direction: -1 }))).toEqual(['1', '2', '3'])
  })

  it('sorts by the status in the order of the workflow', () => {
    const ascending = numbers(selectQueueRows(APPLICATIONS, { ...QUERY, filter: 'all', sortKey: 'status', direction: 1 }))

    expect(ascending).toEqual(['1', '2', '3', '4', '5'])
    expect(numbers(selectQueueRows(APPLICATIONS, { ...QUERY, filter: 'all', sortKey: 'status', direction: -1 }))).toEqual(['5', '4', '2', '3', '1'])
    expect(numbers(selectQueueRows(APPLICATIONS, { ...QUERY, mode: 'done', sortKey: 'status', direction: 1 }))).toEqual(['6', '7'])
  })

  it('sorts by the score and puts the unscored ones last', () => {
    expect(numbers(selectQueueRows(APPLICATIONS, { ...QUERY, sortKey: 'score', direction: -1 }))[0]).toBe('2')
    expect(numbers(selectQueueRows(APPLICATIONS, { ...QUERY, sortKey: 'score', direction: -1 })).at(-1)).toBe('1')
  })

  it('sorts the most urgent applications first by the deadline', () => {
    expect(numbers(selectQueueRows(APPLICATIONS, { ...QUERY, sortKey: 'sla', direction: -1 }))[0]).toBe('3')
  })

  it('reverses the date order', () => {
    expect(numbers(selectQueueRows(APPLICATIONS, { ...QUERY, direction: -1 })).at(0)).toBe('3')
  })
})

describe('counters', () => {
  it('counts the applications of every filter', () => {
    expect(countByFilter(APPLICATIONS, 'work')).toBe(5)
    expect(countByFilter(APPLICATIONS, 'ready')).toBe(2)
    expect(countByFilter(APPLICATIONS, 'all')).toBe(7)
  })

  it('summarizes the queue', () => {
    expect(summarizeQueue(APPLICATIONS, 'u1', NOW)).toEqual({
      receivedToday: 4,
      total: 5,
      waitingForDecision: 2,
      inWorkByEmployee: 2,
      overdue: 1,
    })
  })

  it('counts the numbers next to the menu', () => {
    expect(countNavigation(APPLICATIONS, 'u1')).toEqual({ queue: 3, mine: 2 })
  })

  it('selects the applications of a mode', () => {
    expect(selectModeApplications(APPLICATIONS, 'queue', 'u1')).toHaveLength(5)
    expect(selectModeApplications(APPLICATIONS, 'mine', 'u1')).toHaveLength(2)
    expect(selectModeApplications(APPLICATIONS, 'done', 'u1')).toHaveLength(2)
  })
})
