import { makeAutoObservable, runInAction } from 'mobx'

import {
  CREDIT_GOALS,
  CREDIT_TIME_UNITS,
  LOAN_TERMS_IN_MONTHS,
  MAX_LOAN_SUM,
  MIN_LOAN_SUM,
  createApplication,
  getBankProducts,
  getLoanLimits,
} from '@/entities/application'
import type { Application, CreditGoalId, LoanLimits } from '@/entities/application'
import { getErrorMessage } from '@/shared/api'
import { formatMoneyShort, formatNumber, groupDigits, normalizeDigits, parseDigits } from '@/shared/lib'

const DEFAULT_SUM = 100_000
const DEFAULT_TERM_IN_MONTHS = 24

const GOAL_MISSING_MESSAGE = 'Выберите, для чего нужны деньги'
const RUBLE_SUFFIX = /\u00a0₽$/
const NBSP_PATTERN = /\u00a0/g

function isCreditGoalId(value: string): value is CreditGoalId {
  return CREDIT_GOALS.some(({ id }) => id === value)
}

export interface LoanParams {
  goal: CreditGoalId | null
  sum: number
  termInMonths: number
}

const DEFAULT_PARAMS: LoanParams = { goal: null, sum: DEFAULT_SUM, termInMonths: DEFAULT_TERM_IN_MONTHS }

interface LimitsOptions {
  /** The kind of the company: the bank lends different sums to a company and to a sole proprietor. */
  isLegalEntity: boolean
}

export class CreateApplicationFormStore {
  readonly organizationId: number
  /** `null` until the user picks one. */
  goal: CreditGoalId | null
  sumText: string
  termInMonths: number
  isSubmitting = false
  errorMessage: string | null = null
  /** What the bank lends to this company; `null` until the catalog of the bank is read, then the limits of the design apply. */
  limits: LoanLimits | null = null

  constructor(organizationId: number, initial: LoanParams = DEFAULT_PARAMS, limitsOptions: LimitsOptions | null = null) {
    this.organizationId = organizationId
    this.goal = initial.goal
    this.sumText = formatNumber(initial.sum)
    this.termInMonths = initial.termInMonths
    makeAutoObservable(this)
    if (limitsOptions) void this.loadLimits(limitsOptions)
  }

  /** The sums that can be asked: the range of the bank products, or the range of the design while it is not known. */
  get sumRange(): { min: number; max: number } {
    return this.limits ? { min: this.limits.minSum, max: this.limits.maxSum } : { min: MIN_LOAN_SUM, max: MAX_LOAN_SUM }
  }

  /** The terms of the list that some product of the bank allows. */
  get termOptions(): readonly number[] {
    const { limits } = this
    if (!limits) return LOAN_TERMS_IN_MONTHS
    const allowed = LOAN_TERMS_IN_MONTHS.filter((months) => months >= limits.minTermInMonths && months <= limits.maxTermInMonths)
    return allowed.length > 0 ? allowed : LOAN_TERMS_IN_MONTHS
  }

  get sumOutOfRangeMessage(): string {
    const { min, max } = this.sumRange
    return `Сумма от ${formatMoneyShort(min).replace(RUBLE_SUFFIX, '')} до ${formatMoneyShort(max)}`.replace(NBSP_PATTERN, ' ')
  }

  get sum(): number {
    return parseDigits(this.sumText)
  }

  /** Accepts a goal id from a `<select>`; unknown values are ignored. */
  setGoal(value: string): void {
    if (isCreditGoalId(value)) this.goal = value
  }

  /** Keeps only digits and groups them by thousands, as the user types. */
  setSum(text: string): void {
    this.sumText = groupDigits(text)
  }

  /** Called when the user leaves the field: the zeros left by editing go away. */
  normalizeSum(): void {
    this.sumText = normalizeDigits(this.sumText)
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

  /** Reads the products of the bank; without them the cabinet keeps the limits of the design. */
  private async loadLimits({ isLegalEntity }: LimitsOptions): Promise<void> {
    try {
      const limits = getLoanLimits(await getBankProducts(), { isLegalEntity })
      runInAction(() => {
        this.limits = limits
      })
    } catch {
      // The catalog is a hint for the form; when it cannot be read the limits of the design stay and the bank checks the rest.
    }
  }

  private getValidationMessage(): string | null {
    if (this.goal === null) return GOAL_MISSING_MESSAGE
    const { min, max } = this.sumRange
    if (this.sum < min || this.sum > max) return this.sumOutOfRangeMessage
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
