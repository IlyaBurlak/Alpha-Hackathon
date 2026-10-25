import { makeAutoObservable } from 'mobx'

import type { Employee } from '@/entities/employee'
import { assignStaffApplication } from '@/entities/staff-application'
import type { StaffApplication, StaffApplicationDetailStore, StaffApplicationListStore } from '@/entities/staff-application'
import { getErrorMessage } from '@/shared/api'

/** Who is responsible for an application: takes it for the employee or hands it over, and updates the screens. */
export class AssignmentStore {
  isSaving = false
  errorMessage: string | null = null

  private readonly list: StaffApplicationListStore
  private readonly detail: StaffApplicationDetailStore | null

  constructor(list: StaffApplicationListStore, detail: StaffApplicationDetailStore | null = null) {
    this.list = list
    this.detail = detail
    makeAutoObservable<AssignmentStore, 'list' | 'detail'>(this, { list: false, detail: false })
  }

  /** Returns the updated application, or `null` when saving failed (see `errorMessage`). */
  async assign(applicationId: string, assignee: Employee | null): Promise<StaffApplication | null> {
    if (this.isSaving) return null

    this.startSaving()
    try {
      const application = await assignStaffApplication(applicationId, assignee && { id: assignee.id, name: assignee.name })
      this.list.replace(application)
      this.detail?.replace(application)
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
