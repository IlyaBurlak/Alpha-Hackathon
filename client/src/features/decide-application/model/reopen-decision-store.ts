import { makeAutoObservable } from 'mobx'

import { reopenStaffApplication } from '@/entities/staff-application'
import type {
  ActingEmployee,
  StaffApplication,
  StaffApplicationDetailStore,
  StaffApplicationListStore,
} from '@/entities/staff-application'
import { getErrorMessage } from '@/shared/api'

/** Takes a counter offer or a data request back to the review, so the decision can be made again. */
export class ReopenDecisionStore {
  isSaving = false
  errorMessage: string | null = null

  private readonly list: StaffApplicationListStore
  private readonly detail: StaffApplicationDetailStore

  constructor(list: StaffApplicationListStore, detail: StaffApplicationDetailStore) {
    this.list = list
    this.detail = detail
    makeAutoObservable<ReopenDecisionStore, 'list' | 'detail'>(this, { list: false, detail: false })
  }

  /** Returns the updated application, or `null` when saving failed (see `errorMessage`). */
  async reopen(applicationId: string, actor: ActingEmployee): Promise<StaffApplication | null> {
    if (this.isSaving) return null

    this.startSaving()
    try {
      const application = await reopenStaffApplication(applicationId, actor)
      this.list.replace(application)
      this.detail.replace(application)
      this.finishSaving()
      return application
    } catch (error) {
      this.failSaving(getErrorMessage(error))
      return null
    }
  }

  private startSaving(): void {
    this.isSaving = true
    this.errorMessage = null
  }

  private finishSaving(): void {
    this.isSaving = false
  }

  private failSaving(message: string): void {
    this.isSaving = false
    this.errorMessage = message
  }
}
