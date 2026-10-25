import { makeAutoObservable, observableRef } from 'mobx'

import { getErrorMessage } from '@/shared/api'

import { getStaffApplications } from '../api/staff-applications'
import { STAFF_STATUSES } from './types'
import type { StaffApplication } from './types'

export type StaffApplicationListState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; applications: StaffApplication[] }
  | { status: 'error'; message: string }

export class StaffApplicationListStore {
  state: StaffApplicationListState = { status: 'idle' }

  constructor() {
    makeAutoObservable(this, { state: observableRef })
  }

  /** The loaded applications; empty until the first load succeeds. */
  get applications(): StaffApplication[] {
    return this.state.status === 'success' ? this.state.applications : []
  }

  /** Loads with a spinner: for the first load and for retries. */
  async load(): Promise<void> {
    this.setState({ status: 'loading' })
    try {
      this.setState({ status: 'success', applications: await getStaffApplications() })
    } catch (error) {
      this.setState({ status: 'error', message: getErrorMessage(error) })
    }
  }

  /**
   * Updates a shown list quietly. Returns the applications whose scoring has finished since the last load,
   * so the screen can tell the employee about them; a failed refresh keeps the old data.
   */
  async refresh(): Promise<StaffApplication[]> {
    if (this.state.status !== 'success') {
      await this.load()
      return []
    }
    const previous = this.state.applications
    try {
      const applications = await getStaffApplications()
      this.setState({ status: 'success', applications })
      return applications.filter(({ id, status }) => {
        const before = previous.find((application) => application.id === id)
        return before?.status === STAFF_STATUSES.scoring && status !== STAFF_STATUSES.scoring
      })
    } catch {
      // The list on screen is still valid; the next refresh or a reload will show a real error.
      return []
    }
  }

  /** Puts a fresher copy of one application (returned by an action) into the loaded list. */
  replace(updated: StaffApplication): void {
    if (this.state.status !== 'success') return
    this.setState({
      status: 'success',
      applications: this.state.applications.map((application) => (application.id === updated.id ? updated : application)),
    })
  }

  reset(): void {
    this.setState({ status: 'idle' })
  }

  private setState(state: StaffApplicationListState): void {
    this.state = state
  }
}
