import { makeAutoObservable, observableRef } from 'mobx'

import { getErrorMessage } from '@/shared/api'

import { getMyApplications } from '../api/applications'
import { settlePayout } from '../api/mocks/mock-enrichment'
import { APPLICATION_STATUSES } from './types'
import type { Application, ApplicationStatus } from './types'

const ACTION_STATUSES: readonly ApplicationStatus[] = [
  APPLICATION_STATUSES.approved,
  APPLICATION_STATUSES.offered,
  APPLICATION_STATUSES.offerAccepted,
]

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
    this.setState({ status: 'loading' })
    try {
      this.setState({ status: 'success', applications: await getMyApplications() })
    } catch (error) {
      this.setState({ status: 'error', message: getErrorMessage(error) })
    }
  }

  /** Updates a shown list quietly; a failed refresh keeps the old data on screen. */
  async refresh(): Promise<void> {
    if (this.state.status !== 'success') {
      await this.load()
      return
    }
    try {
      this.setState({ status: 'success', applications: await getMyApplications() })
    } catch {
      // The list on screen is still valid; the next refresh or a reload will show a real error.
    }
  }

  /** Shows loans as issued when their payout timer is over (a client mock, no request). */
  settlePayouts(): void {
    if (this.state.status !== 'success') return
    const now = Date.now()
    this.setState({ status: 'success', applications: this.state.applications.map((application) => settlePayout(application, now)) })
  }

  /** Loads only if nobody has asked yet. */
  async loadOnce(): Promise<void> {
    if (this.state.status === 'idle') await this.load()
  }

  /** Forgets the loaded list, e.g. when the user signs out. */
  reset(): void {
    this.setState({ status: 'idle' })
  }

  private setState(state: ApplicationListState): void {
    this.state = state
  }
}
