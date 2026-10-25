import { makeAutoObservable, observableRef } from 'mobx'

import { getErrorMessage } from '@/shared/api'

import { getCurrentUser } from '../api/get-current-user'
import type { Organization, User } from './types'

export type UserState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; user: User }
  | { status: 'error'; message: string }

export class UserStore {
  state: UserState = { status: 'idle' }
  selectedOrganizationId: number | null = null

  constructor() {
    makeAutoObservable(this, { state: observableRef })
  }

  /** The organization the cabinet works on: the chosen one, else the first of the user. */
  get selectedOrganization(): Organization | null {
    if (this.state.status !== 'success') return null
    const { organizations } = this.state.user
    return organizations.find(({ id }) => id === this.selectedOrganizationId) ?? organizations[0] ?? null
  }

  selectOrganization(organizationId: number): void {
    this.selectedOrganizationId = organizationId
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
