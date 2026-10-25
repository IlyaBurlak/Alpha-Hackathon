import { makeAutoObservable } from 'mobx'

import { SCORING_STATUSES, restartStaffScoring } from '@/entities/staff-application'
import type { StaffApplication, StaffApplicationDetailStore, StaffApplicationListStore } from '@/entities/staff-application'
import { getErrorMessage } from '@/shared/api'

/** After a restart the result is asked for a few times, then the employee refreshes it by hand: it is not a constant polling. */
const CHECK_INTERVAL_MS = 3000
const MAX_CHECKS = 10

type Wait = (milliseconds: number) => Promise<void>

function waitFor(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })
}

/** Runs the scoring of an application again and follows it for a short while, so the result shows up on its own. */
export class RestartScoringStore {
  isConfirming = false
  isSaving = false
  /** The scoring was restarted and the result is being waited for. */
  isWaiting = false
  errorMessage: string | null = null

  private readonly list: StaffApplicationListStore
  private readonly detail: StaffApplicationDetailStore
  private readonly wait: Wait
  /** A newer restart, or leaving the page, makes an older wait stop. */
  private waitId = 0

  constructor(list: StaffApplicationListStore, detail: StaffApplicationDetailStore, wait: Wait = waitFor) {
    this.list = list
    this.detail = detail
    this.wait = wait
    makeAutoObservable<RestartScoringStore, 'list' | 'detail' | 'wait' | 'waitId'>(this, {
      list: false,
      detail: false,
      wait: false,
      waitId: false,
    })
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
      void this.followScoring(applicationId, application)
      return application
    } catch (error) {
      this.errorMessage = getErrorMessage(error)
      this.finish()
      return null
    }
  }

  /** Stops waiting, e.g. when the employee leaves the page. */
  stopWaiting(): void {
    this.waitId += 1
    this.isWaiting = false
  }

  /**
   * The backend restarts the scoring in the background. The result is there when a running scoring has finished,
   * or when it was already over by the first look but is a new one (another moment of the model).
   */
  private async followScoring(applicationId: string, restarted: StaffApplication): Promise<void> {
    this.waitId += 1
    const id = this.waitId
    this.isWaiting = true
    let hasSeenRunning = restarted.scoringStatus === SCORING_STATUSES.pending

    for (let check = 0; check < MAX_CHECKS; check += 1) {
      await this.wait(CHECK_INTERVAL_MS)
      if (id !== this.waitId) return
      await this.detail.refresh(applicationId)
      if (id !== this.waitId) return

      const current = this.detail.state.status === 'success' ? this.detail.state.application : null
      if (current === null) continue
      if (current.scoringStatus === SCORING_STATUSES.pending) {
        hasSeenRunning = true
        continue
      }
      const isNewResult = current.scoring?.updatedAt.getTime() !== restarted.scoring?.updatedAt.getTime()
      if (hasSeenRunning || isNewResult) break
    }
    if (id === this.waitId) this.isWaiting = false
  }

  private finish(): void {
    this.isSaving = false
    this.isConfirming = false
  }
}
