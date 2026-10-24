import { makeAutoObservable } from 'mobx'

import {
  COMMENT_MAX_LENGTH,
  DECISION_TYPES,
  DOCUMENT_REQUESTS,
  MIN_COMMENT_LENGTH,
  MIN_OFFER_AMOUNT,
  decideStaffApplication,
} from '@/entities/staff-application'
import type {
  ActingEmployee,
  Decision,
  DecisionType,
  StaffApplication,
  StaffApplicationDetailStore,
  StaffApplicationListStore,
} from '@/entities/staff-application'
import { getErrorMessage } from '@/shared/api'
import { calculateAnnuityPayment, formatNumber } from '@/shared/lib'

const NOT_DIGIT_PATTERN = /\D/g
const NOT_DECIMAL_PATTERN = /[^\d.,]/g
const AMOUNT_ROUNDING = 100_000
const SUGGESTED_AMOUNT_SHARE = 0.75
const SUGGESTED_RATE_EXTRA = 1
/** The documents the design ticks when the recommendation is to ask for data. */
const RECOMMENDED_DOCUMENTS = [DOCUMENT_REQUESTS[0], DOCUMENT_REQUESTS[4]]

export type DecisionField = 'comment' | 'reason' | 'documents' | 'offer'

export const DECISION_MESSAGES = {
  comment: 'Напишите клиенту комментарий, хотя бы пару слов',
  reason: 'Выберите причину отказа',
  documents: 'Отметьте, какие данные нужны',
  offer: 'Проверьте сумму и ставку',
} as const

/** The decision an employee is preparing for one application. */
export class DecisionFormStore {
  readonly application: StaffApplication
  /** `null` while the employee follows the recommendation of the system. */
  chosenType: DecisionType | null = null
  amountText: string
  termInMonths: number
  rateText: string
  documents: string[]
  reason = ''
  comment = ''
  invalidField: DecisionField | null = null
  errorMessage: string | null = null
  isConfirming = false
  isSaving = false

  private readonly list: StaffApplicationListStore
  private readonly detail: StaffApplicationDetailStore | null

  constructor(application: StaffApplication, list: StaffApplicationListStore, detail: StaffApplicationDetailStore | null = null) {
    this.application = application
    this.list = list
    this.detail = detail
    const { recommendation, scoring } = application
    this.amountText = formatNumber(recommendation?.offer?.amount ?? Math.round((application.amount * SUGGESTED_AMOUNT_SHARE) / AMOUNT_ROUNDING) * AMOUNT_ROUNDING)
    this.termInMonths = recommendation?.offer?.termInMonths ?? application.termInMonths
    this.rateText = String(Number(((scoring?.rate ?? 0) + SUGGESTED_RATE_EXTRA).toFixed(1))).replace('.', ',')
    this.documents = recommendation?.type === DECISION_TYPES.clarify ? [...RECOMMENDED_DOCUMENTS] : []
    makeAutoObservable<DecisionFormStore, 'list' | 'detail'>(this, { application: false, list: false, detail: false })
  }

  /** The chosen option, otherwise the recommended one. */
  get type(): DecisionType {
    return this.chosenType ?? this.application.recommendation?.type ?? DECISION_TYPES.approve
  }

  get amount(): number {
    return Number(this.amountText.replace(NOT_DIGIT_PATTERN, ''))
  }

  get rate(): number {
    return Number.parseFloat(this.rateText.replace(',', '.')) || 0
  }

  /** The payment of the counter offer; `null` until the sum and the rate are filled in. */
  get offerPayment(): number | null {
    if (this.amount <= 0 || this.rate <= 0) return null
    return calculateAnnuityPayment(this.amount, this.rate, this.termInMonths)
  }

  /** The decision as it is going to be sent. */
  get decision(): Decision {
    const comment = this.comment.trim()
    if (this.type === DECISION_TYPES.offer) {
      return { type: 'offer', comment, amount: this.amount, termInMonths: this.termInMonths, rate: this.rate }
    }
    if (this.type === DECISION_TYPES.clarify) return { type: 'clarify', comment, documents: [...this.documents] }
    if (this.type === DECISION_TYPES.reject) return { type: 'reject', comment, reason: this.reason }
    return { type: 'approve', comment }
  }

  choose(type: DecisionType): void {
    this.chosenType = type
    this.clearError()
  }

  setAmount(text: string): void {
    const digits = text.replace(NOT_DIGIT_PATTERN, '')
    this.amountText = digits === '' ? '' : formatNumber(Number(digits))
  }

  setRate(text: string): void {
    this.rateText = text.replace(NOT_DECIMAL_PATTERN, '')
  }

  setTerm(termInMonths: number): void {
    this.termInMonths = termInMonths
  }

  toggleDocument(document: string, isRequested: boolean): void {
    this.documents = isRequested ? [...this.documents, document] : this.documents.filter((item) => item !== document)
  }

  setReason(reason: string): void {
    this.reason = reason
  }

  setComment(comment: string): void {
    this.comment = comment.slice(0, COMMENT_MAX_LENGTH)
  }

  /** Checks the form; when it is fine the employee is asked to confirm. */
  requestConfirmation(): void {
    this.clearError()
    const problem = this.findProblem()
    if (problem) {
      this.invalidField = problem
      this.errorMessage = DECISION_MESSAGES[problem]
      return
    }
    this.isConfirming = true
  }

  cancelConfirmation(): void {
    this.isConfirming = false
  }

  /** Sends the decision. Returns the updated application, or `null` when saving failed (see `errorMessage`). */
  async confirm(actor: ActingEmployee): Promise<StaffApplication | null> {
    if (this.isSaving) return null

    this.startSaving()
    try {
      return this.show(await decideStaffApplication(this.application.id, this.decision, actor))
    } catch (error) {
      this.failSaving(getErrorMessage(error))
      return null
    }
  }

  private findProblem(): DecisionField | null {
    const needsComment = this.type === DECISION_TYPES.clarify || this.type === DECISION_TYPES.reject
    if (needsComment && this.comment.trim().length < MIN_COMMENT_LENGTH) return 'comment'
    if (this.type === DECISION_TYPES.reject && this.reason === '') return 'reason'
    if (this.type === DECISION_TYPES.clarify && this.documents.length === 0) return 'documents'
    if (this.type === DECISION_TYPES.offer && (this.amount < MIN_OFFER_AMOUNT || this.rate <= 0)) return 'offer'
    return null
  }

  private show(application: StaffApplication): StaffApplication {
    this.list.replace(application)
    this.detail?.replace(application)
    this.isSaving = false
    this.isConfirming = false
    return application
  }

  private clearError(): void {
    this.invalidField = null
    this.errorMessage = null
  }

  private startSaving(): void {
    this.isSaving = true
    this.errorMessage = null
  }

  private failSaving(message: string): void {
    this.isSaving = false
    this.isConfirming = false
    this.errorMessage = message
  }
}
