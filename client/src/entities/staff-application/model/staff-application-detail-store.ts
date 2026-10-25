import { makeAutoObservable, observableRef } from 'mobx'

import { getErrorMessage } from '@/shared/api'

import { getStaffApplication } from '../api/staff-applications'
import type { StaffApplication } from './types'

export type StaffApplicationDetailState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; application: StaffApplication }
  | { status: 'error'; message: string }

export class StaffApplicationDetailStore {
  state: StaffApplicationDetailState = { status: 'idle' }

  constructor() {
    makeAutoObservable(this, { state: observableRef })
  }

  async load(applicationId: string): Promise<void> {
    this.setState({ status: 'loading' })
    try {
      this.setState({ status: 'success', application: await getStaffApplication(applicationId) })
    } catch (error) {
      this.setState({ status: 'error', message: getErrorMessage(error) })
    }
  }

  /** Updates a shown application quietly, e.g. while its scoring is running; a failure keeps the old data. */
  async refresh(applicationId: string): Promise<void> {
    if (this.state.status !== 'success') return
    try {
      this.setState({ status: 'success', application: await getStaffApplication(applicationId) })
    } catch {
      // The application on screen is still valid; the next refresh or a reload will show a real error.
    }
  }

  /** Shows a fresher copy of the application returned by an action. */
  replace(application: StaffApplication): void {
    this.setState({ status: 'success', application })
  }

  private setState(state: StaffApplicationDetailState): void {
    this.state = state
  }
}
