import { makeAutoObservable, observableRef } from 'mobx'

import { getErrorMessage } from '@/shared/api'

import { getApplication } from '../api/applications'
import type { Application } from './types'

export type ApplicationDetailState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; application: Application }
  | { status: 'error'; message: string }

export class ApplicationDetailStore {
  state: ApplicationDetailState = { status: 'idle' }

  constructor() {
    makeAutoObservable(this, { state: observableRef })
  }

  async load(applicationId: number): Promise<void> {
    this.setState({ status: 'loading' })
    try {
      this.setState({ status: 'success', application: await getApplication(applicationId) })
    } catch (error) {
      this.setState({ status: 'error', message: getErrorMessage(error) })
    }
  }

  /** Replaces the loaded application with a fresher copy returned by an action (e.g. product selection). */
  update(application: Application): void {
    this.setState({ status: 'success', application })
  }

  private setState(state: ApplicationDetailState): void {
    this.state = state
  }
}
