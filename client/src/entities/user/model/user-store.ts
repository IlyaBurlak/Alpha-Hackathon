import { makeAutoObservable, observableRef } from 'mobx'

import { getErrorMessage } from '@/shared/api'

import { getCurrentUser } from '../api/get-current-user'
import type { User } from './types'

export type UserState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; user: User }
  | { status: 'error'; message: string }

export class UserStore {
  state: UserState = { status: 'idle' }

  constructor() {
    makeAutoObservable(this, { state: observableRef })
  }

  async load(): Promise<void> {
    this.setState({ status: 'loading' })
    try {
      this.setState({ status: 'success', user: await getCurrentUser() })
    } catch (error) {
      this.setState({ status: 'error', message: getErrorMessage(error) })
    }
  }

  reset(): void {
    this.setState({ status: 'idle' })
  }

  private setState(state: UserState): void {
    this.state = state
  }
}
