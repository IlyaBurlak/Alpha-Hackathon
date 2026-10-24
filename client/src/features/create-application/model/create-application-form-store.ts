import { makeAutoObservable } from 'mobx'

import { CREDIT_TIME_UNITS, createApplication } from '@/entities/application'
import type { Application, CreditTimeUnit } from '@/entities/application'
import { getErrorMessage } from '@/shared/api'

export class CreateApplicationFormStore {
  readonly organizationId: number
  sum = ''
  termValue = ''
  termUnit: CreditTimeUnit = CREDIT_TIME_UNITS.year
  isSubmitting = false
  errorMessage: string | null = null

  constructor(organizationId: number) {
    this.organizationId = organizationId
    makeAutoObservable(this)
  }

  get parsedSum(): number {
    return Number(this.sum)
  }

  get parsedTermValue(): number {
    return Number(this.termValue)
  }

  get canSubmit(): boolean {
    return (
      this.parsedSum > 0 &&
      Number.isInteger(this.parsedTermValue) &&
      this.parsedTermValue > 0 &&
      !this.isSubmitting
    )
  }

  setSum(sum: string): void {
    this.sum = sum
  }

  setTermValue(termValue: string): void {
    this.termValue = termValue
  }

  setTermUnit(termUnit: CreditTimeUnit): void {
    this.termUnit = termUnit
  }

  /** Returns the created application, or `null` when the request failed (the message is in `errorMessage`). */
  async submit(): Promise<Application | null> {
    if (!this.canSubmit) return null

    this.startSubmitting()
    try {
      const application = await createApplication({
        organizationId: this.organizationId,
        sum: this.parsedSum,
        creditTime: { unit: this.termUnit, value: this.parsedTermValue },
      })
      this.finishSubmitting()
      return application
    } catch (error) {
      this.failSubmitting(getErrorMessage(error))
      return null
    }
  }

  private startSubmitting(): void {
    this.isSubmitting = true
    this.errorMessage = null
  }

  private finishSubmitting(): void {
    this.isSubmitting = false
  }

  private failSubmitting(message: string): void {
    this.isSubmitting = false
    this.errorMessage = message
  }
}
