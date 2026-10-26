import { makeAutoObservable } from 'mobx'

import { AsyncResource } from '@/shared/api'
import type { ResourceState } from '@/shared/api'

import { getStaffApplications } from '../api/staff-applications'
import { STAFF_STATUSES } from './types'
import type { StaffApplication } from './types'

export type StaffApplicationListState = ResourceState<{ applications: StaffApplication[] }>

async function requestApplications(): Promise<{ applications: StaffApplication[] }> {
  return { applications: await getStaffApplications() }
}

export class StaffApplicationListStore {
  private readonly resource = new AsyncResource<{ applications: StaffApplication[] }>()

  constructor() {
    makeAutoObservable(this)
  }

  get state(): StaffApplicationListState {
    return this.resource.state
  }

  /** The loaded applications; empty until the first load succeeds. */
  get applications(): StaffApplication[] {
    return this.state.status === 'success' ? this.state.applications : []
  }

  /** Loads with a spinner: for the first load and for retries. */
  async load(): Promise<void> {
    await this.resource.load(requestApplications)
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
    const refreshed = await this.resource.refresh(requestApplications)
    if (refreshed === null) return []
    return refreshed.applications.filter(({ id, status }) => {
      const before = previous.find((application) => application.id === id)
      return before?.status === STAFF_STATUSES.scoring && status !== STAFF_STATUSES.scoring
    })
  }

  /** Puts a fresher copy of one application (returned by an action) into the loaded list. */
  replace(updated: StaffApplication): void {
    if (this.state.status !== 'success') return
    this.resource.set({
      applications: this.state.applications.map((application) => (application.id === updated.id ? updated : application)),
    })
  }

  reset(): void {
    this.resource.reset()
  }
}
