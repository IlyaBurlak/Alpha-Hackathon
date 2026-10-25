import { makeAutoObservable } from 'mobx'

import { AsyncResource } from '@/shared/api'
import type { ResourceState } from '@/shared/api'

import { getStaffApplication } from '../api/staff-applications'
import type { StaffApplication } from './types'

export type StaffApplicationDetailState = ResourceState<{ application: StaffApplication }>

export class StaffApplicationDetailStore {
  private readonly resource = new AsyncResource<{ application: StaffApplication }>()

  constructor() {
    makeAutoObservable(this)
  }

  get state(): StaffApplicationDetailState {
    return this.resource.state
  }

  async load(applicationId: string): Promise<void> {
    await this.resource.load(async () => ({ application: await getStaffApplication(applicationId) }))
  }

  /** Updates a shown application quietly, e.g. while its scoring is running; a failure keeps the old data. */
  async refresh(applicationId: string): Promise<void> {
    if (this.state.status !== 'success') return
    await this.resource.refresh(async () => ({ application: await getStaffApplication(applicationId) }))
  }

  /** Shows a fresher copy of the application returned by an action. */
  replace(application: StaffApplication): void {
    this.resource.set({ application })
  }
}
