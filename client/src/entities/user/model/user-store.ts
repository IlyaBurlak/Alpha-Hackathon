import { makeAutoObservable } from 'mobx'

import { AsyncResource } from '@/shared/api'
import type { ResourceState } from '@/shared/api'

import { getCurrentUser } from '../api/get-current-user'
import type { Organization, User } from './types'

export type UserState = ResourceState<{ user: User }>

export class UserStore {
  selectedOrganizationId: number | null = null
  private readonly resource = new AsyncResource<{ user: User }>()

  constructor() {
    makeAutoObservable(this)
  }

  get state(): UserState {
    return this.resource.state
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
    await this.resource.load(async () => ({ user: await getCurrentUser() }))
  }

  reset(): void {
    this.resource.reset()
  }
}
