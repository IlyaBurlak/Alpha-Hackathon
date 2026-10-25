import { makeAutoObservable, observableRef } from 'mobx'

import { getErrorMessage } from '@/shared/api'

import { answerSpecialOffer, getApplication } from '../api/applications'
import { signApplication, withdrawApplication } from '../api/mocks/mock-actions'
import { settlePayout } from '../api/mocks/mock-enrichment'
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

  /** Updates a shown application quietly (e.g. while the bank reviews it); a failed refresh keeps the old data. */
  async refresh(applicationId: number): Promise<void> {
    if (this.state.status !== 'success') return
    try {
      this.setState({ status: 'success', application: await getApplication(applicationId) })
    } catch {
      // The application on screen is still valid; the next poll or a reload will show a real error.
    }
  }

  /** Withdraws the application from review and shows the result. */
  async withdraw(applicationId: number): Promise<void> {
    withdrawApplication(applicationId)
    await this.refresh(applicationId)
  }

  /** Signs the contract of an approved application and shows the result. */
  async sign(applicationId: number): Promise<void> {
    signApplication(applicationId)
    await this.refresh(applicationId)
  }

  /** Sends the answer to other conditions offered by the bank and shows the result. */
  async answerOffer(applicationId: number, isAccepted: boolean): Promise<void> {
    await answerSpecialOffer(applicationId, isAccepted)
    await this.refresh(applicationId)
  }

  /** Shows the loan as issued when the payout timer is over; the payout is a client mock, so nothing is requested. */
  settlePayout(): void {
    if (this.state.status === 'success') {
      this.setState({ status: 'success', application: settlePayout(this.state.application, Date.now()) })
    }
  }

  private setState(state: ApplicationDetailState): void {
    this.state = state
  }
}
