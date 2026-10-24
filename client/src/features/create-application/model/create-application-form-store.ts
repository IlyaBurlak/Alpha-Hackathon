import { makeAutoObservable } from 'mobx'

import { CREDIT_GOALS, CREDIT_TIME_UNITS, MAX_LOAN_SUM, MIN_LOAN_SUM, createApplication } from '@/entities/application'
import type { Application, CreditGoalId } from '@/entities/application'
import { getErrorMessage } from '@/shared/api'
import { formatNumber } from '@/shared/lib'

const DEFAULT_SUM = 3_000_000
const DEFAULT_TERM_IN_MONTHS = 24
const NOT_DIGIT_PATTERN = /\D/g

const GOAL_MISSING_MESSAGE = 'Выберите, для чего нужны деньги'
const SUM_OUT_OF_RANGE_MESSAGE = 'Сумма от 100 тыс до 50 млн ₽'

function isCreditGoalId(value: string): value is CreditGoalId {
  return CREDIT_GOALS.some(({ id }) => id === value)
}

export interface LoanParams {
  goal: CreditGoalId | null
  sum: number
  termInMonths: number
}

const DEFAULT_PARAMS: LoanParams = { goal: null, sum: DEFAULT_SUM, termInMonths: DEFAULT_TERM_IN_MONTHS }

export class CreateApplicationFormStore {
  readonly organizationId: number
  /** `null` until the user picks one. */
  goal: CreditGoalId | null
  sumText: string
  termInMonths: number
  isSubmitting = false
  errorMessage: string | null = null

  constructor(organizationId: number, initial: LoanParams = DEFAULT_PARAMS) {
    this.organizationId = organizationId
    this.goal = initial.goal
    this.sumText = formatNumber(initial.sum)
    this.termInMonths = initial.termInMonths
    makeAutoObservable(this)
  }

  get sum(): number {
    return Number(this.sumText.replace(NOT_DIGIT_PATTERN, ''))
  }

  /** Accepts a goal id from a `<select>`; unknown values are ignored. */
  setGoal(value: string): void {
    if (isCreditGoalId(value)) this.goal = value
  }

  /** Keeps only digits and groups them by thousands, as the user types. */
  setSum(text: string): void {
    const digits = text.replace(NOT_DIGIT_PATTERN, '')
    this.sumText = digits === '' ? '' : formatNumber(Number(digits))
  }

  setTermInMonths(termInMonths: number): void {
    this.termInMonths = termInMonths
  }

  /** Returns the created application, or `null` when the form is invalid or the request failed (see `errorMessage`). */
  async submit(): Promise<Application | null> {
    if (this.isSubmitting) return null

    const validationMessage = this.getValidationMessage()
    if (validationMessage !== null || this.goal === null) {
      this.failSubmitting(validationMessage ?? GOAL_MISSING_MESSAGE)
      return null
    }

    this.startSubmitting()
    try {
      const application = await createApplication({
        organizationId: this.organizationId,
        sum: this.sum,
        creditTime: { unit: CREDIT_TIME_UNITS.month, value: this.termInMonths },
        goal: this.goal,
      })
      this.finishSubmitting()
      return application
    } catch (error) {
      this.failSubmitting(getErrorMessage(error))
      return null
    }
  }

  private getValidationMessage(): string | null {
    if (this.goal === null) return GOAL_MISSING_MESSAGE
    if (this.sum < MIN_LOAN_SUM || this.sum > MAX_LOAN_SUM) return SUM_OUT_OF_RANGE_MESSAGE
    return null
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
