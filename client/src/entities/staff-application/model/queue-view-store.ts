import { makeAutoObservable } from 'mobx'

import { ASCENDING_FIRST_SORT_KEYS } from '../lib/queue-selection'
import type { QueueFilter, QueueSortKey } from '../lib/queue-selection'

const DEFAULT_SORT_KEY: QueueSortKey = 'received'

/** How the employee looks at the lists: kept while moving between the queue, "mine" and "done". */
export class QueueViewStore {
  filter: QueueFilter = 'work'
  onlyMine = false
  query = ''
  sortKey: QueueSortKey = DEFAULT_SORT_KEY
  direction: 1 | -1 = 1

  constructor() {
    makeAutoObservable(this)
  }

  /** The arrow in the header: the newest first is "descending" for the date, a bigger value first for amounts and scores, "А" first for the text columns is "ascending". */
  get isDescending(): boolean {
    return this.sortKey === 'received' ? this.direction > 0 : this.direction < 0
  }

  setFilter(filter: QueueFilter): void {
    this.filter = filter
    this.onlyMine = false
  }

  setOnlyMine(onlyMine: boolean): void {
    this.onlyMine = onlyMine
  }

  setQuery(query: string): void {
    this.query = query
  }

  /** A click on a column header: the same column flips the order, a new one starts with its natural order. */
  sortBy(key: QueueSortKey): void {
    if (this.sortKey === key) {
      this.direction = this.direction === 1 ? -1 : 1
      return
    }
    this.sortKey = key
    this.direction = key === 'received' || ASCENDING_FIRST_SORT_KEYS.includes(key) ? 1 : -1
  }

  /** "Show my work": the applications of the employee that are still open. */
  showMyWork(): void {
    this.filter = 'work'
    this.onlyMine = true
  }

  /** "Show the overdue ones first". */
  showMostUrgent(): void {
    this.filter = 'work'
    this.sortKey = 'sla'
    this.direction = -1
  }
}
