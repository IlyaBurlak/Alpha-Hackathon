import { makeAutoObservable } from 'mobx'

import { selectApplicationProduct } from '@/entities/application'
import type { Application } from '@/entities/application'
import { getErrorMessage } from '@/shared/api'

export class SelectProductStore {
  /** Id of the offer being submitted; disables all offers while the request is in flight. */
  pendingProductId: number | null = null
  errorMessage: string | null = null

  constructor() {
    makeAutoObservable(this)
  }

  get isSubmitting(): boolean {
    return this.pendingProductId !== null
  }

  /** Returns the updated application, or `null` when the request failed (the message is in `errorMessage`). */
  async select(applicationId: number, productId: number): Promise<Application | null> {
    if (this.isSubmitting) return null

    this.start(productId)
    try {
      const application = await selectApplicationProduct(applicationId, productId)
      this.finish()
      return application
    } catch (error) {
      this.fail(getErrorMessage(error))
      return null
    }
  }

  private start(productId: number): void {
    this.pendingProductId = productId
    this.errorMessage = null
  }

  private finish(): void {
    this.pendingProductId = null
  }

  private fail(message: string): void {
    this.pendingProductId = null
    this.errorMessage = message
  }
}
