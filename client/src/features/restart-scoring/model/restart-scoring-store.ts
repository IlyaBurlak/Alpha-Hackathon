import { makeAutoObservable } from 'mobx'

import { restartStaffScoring } from '@/entities/staff-application'
import type { StaffApplication, StaffApplicationDetailStore, StaffApplicationListStore } from '@/entities/staff-application'
import { getErrorMessage } from '@/shared/api'

/** Runs the scoring of an application again and shows what the backend says right after. */
export class RestartScoringStore {
  isConfirming = false
  isSaving = false
  errorMessage: string | null = null

  private readonly list: StaffApplicationListStore
  private readonly detail: StaffApplicationDetailStore

  constructor(list: StaffApplicationListStore, detail: StaffApplicationDetailStore) {
    this.list = list
    this.detail = detail
    makeAutoObservable<RestartScoringStore, 'list' | 'detail'>(this, { list: false, detail: false })
  }

  /** Asks the employee to confirm: the previous results are overwritten. */
  askConfirmation(): void {
    this.isConfirming = true
  }

  cancelConfirmation(): void {
    this.isConfirming = false
  }

  /** Returns the updated application, or `null` when the restart failed (see `errorMessage`). */
  async restart(applicationId: string): Promise<StaffApplication | null> {
    if (this.isSaving) return null

    this.isSaving = true
    this.errorMessage = null
    try {
      const application = await restartStaffScoring(applicationId)
      this.list.replace(application)
      this.detail.replace(application)
      this.finish()
      return application
    } catch (error) {
      this.errorMessage = getErrorMessage(error)
      this.finish()
      return null
    }
  }

  private finish(): void {
    this.isSaving = false
    this.isConfirming = false
  }
}
