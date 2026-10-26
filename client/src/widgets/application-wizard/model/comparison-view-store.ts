import { makeAutoObservable } from 'mobx'

export type ComparisonTab = 'structure' | 'balance' | 'schedule'

/** What the "Сравнение вариантов" block shows: the chosen view and whether the payment schedule is unfolded. */
export class ComparisonViewStore {
  tab: ComparisonTab = 'structure'
  isScheduleExpanded = false

  constructor() {
    makeAutoObservable(this)
  }

  setTab(tab: ComparisonTab): void {
    this.tab = tab
  }

  toggleScheduleExpanded(): void {
    this.isScheduleExpanded = !this.isScheduleExpanded
  }
}
