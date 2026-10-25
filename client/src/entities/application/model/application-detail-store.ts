import { makeAutoObservable } from 'mobx'

import { AsyncResource } from '@/shared/api'
import type { ResourceState } from '@/shared/api'

import { answerSpecialOffer, getApplication, signApplication } from '../api/applications'
import { settlePayout } from '../lib/status/settle-payout'
import type { Application } from './types'

export type ApplicationDetailState = ResourceState<{ application: Application }>

export class ApplicationDetailStore {
  private readonly resource = new AsyncResource<{ application: Application }>()

  constructor() {
    makeAutoObservable(this)
  }

  get state(): ApplicationDetailState {
    return this.resource.state
  }

  async load(applicationId: number): Promise<void> {
    await this.resource.load(async () => ({ application: await getApplication(applicationId) }))
  }

  /** Updates a shown application quietly (e.g. while the bank reviews it); a failed refresh keeps the old data. */
  async refresh(applicationId: number): Promise<void> {
    if (this.state.status !== 'success') return
    await this.resource.refresh(async () => ({ application: await getApplication(applicationId) }))
  }

  /** Signs the documents of an approved application and shows the result. */
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
      this.resource.set({ application: settlePayout(this.state.application, Date.now()) })
    }
  }
}
