import { makeAutoObservable } from 'mobx'

import { AsyncResource } from '@/shared/api'
import type { ResourceState } from '@/shared/api'

import { getMyApplications } from '../api/applications'
import { settlePayout } from '../lib/status/settle-payout'
import { APPLICATION_STATUSES } from './types'
import type { Application, ApplicationStatus } from './types'

const ACTION_STATUSES: readonly ApplicationStatus[] = [
  APPLICATION_STATUSES.approved,
  APPLICATION_STATUSES.offered,
  APPLICATION_STATUSES.offerAccepted,
]

export type ApplicationListState = ResourceState<{ applications: Application[] }>

async function requestApplications(): Promise<{ applications: Application[] }> {
  return { applications: await getMyApplications() }
}

export class ApplicationListStore {
  private readonly resource = new AsyncResource<{ applications: Application[] }>()

  constructor() {
    makeAutoObservable(this)
  }

  get state(): ApplicationListState {
    return this.resource.state
  }

  /** Applications of one organization, the latest first. */
  getForOrganization(organizationId: number): Application[] {
    if (this.state.status !== 'success') return []
    return this.state.applications
      .filter((application) => application.organizationId === organizationId)
      .sort((first, second) => second.createdAt.getTime() - first.createdAt.getTime())
  }

  /** Approved applications and other conditions wait for the user's next step, so the navigation highlights them. */
  getApprovedCount(organizationId: number): number {
    return this.getForOrganization(organizationId).filter(({ status }) => ACTION_STATUSES.includes(status)).length
  }

  /** Loads with a spinner: for the first load and for retries. */
  async load(): Promise<void> {
    await this.resource.load(requestApplications)
  }

  /** Updates a shown list quietly; a failed refresh keeps the old data. */
  async refresh(): Promise<void> {
    if (this.state.status !== 'success') {
      await this.load()
      return
    }
    await this.resource.refresh(requestApplications)
  }

  /** Shows loans as issued when their payout timer is over (a client mock, no request). */
  settlePayouts(): void {
    if (this.state.status !== 'success') return
    const now = Date.now()
    this.resource.set({ applications: this.state.applications.map((application) => settlePayout(application, now)) })
  }

  /** Loads only if nobody has asked yet. */
  async loadOnce(): Promise<void> {
    if (this.state.status === 'idle') await this.load()
  }

  /** Forgets the loaded list, e.g. when the user signs out. */
  reset(): void {
    this.resource.reset()
  }
}
