import { makeAutoObservable, observableRef } from 'mobx'

import { getErrorMessage } from '@/shared/api'

import { getMyApplications } from '../api/applications'
import type { Application } from './types'

export type ApplicationListState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; applications: Application[] }
  | { status: 'error'; message: string }

export class ApplicationListStore {
  state: ApplicationListState = { status: 'idle' }

  constructor() {
    makeAutoObservable(this, { state: observableRef })
  }

  async load(): Promise<void> {
    this.setState({ status: 'loading' })
    try {
      this.setState({ status: 'success', applications: await getMyApplications() })
    } catch (error) {
      this.setState({ status: 'error', message: getErrorMessage(error) })
    }
  }

  private setState(state: ApplicationListState): void {
    this.state = state
  }
}
