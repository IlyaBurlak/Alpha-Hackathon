import { makeAutoObservable } from 'mobx'

import { pickVariants, selectApplicationProduct } from '@/entities/application'
import type { Application, CreditVariants, ProductOffer } from '@/entities/application'
import { getErrorMessage } from '@/shared/api'
import { formatPhone, groupDigits, normalizeDigits } from '@/shared/lib'

import { ComparisonViewStore } from './comparison-view-store'
import { readDraft, removeDraft, writeDraft } from './wizard-draft'
import type { SavedDraft, WizardStep } from './wizard-draft'
import { CONSENTS, NOTE_MAX_LENGTH, createInitialForm, isDigitsField } from './wizard-form'
import type {
  ApplicantRole,
  CollateralOwner,
  CollateralType,
  ConsentKey,
  DigitsField,
  OtherLoansAnswer,
  WizardDefaults,
  WizardForm,
} from './wizard-form'
import { validateWizardForm } from './wizard-validation'
import type { FormField, ValidationIssue } from './wizard-validation'

const WHITESPACE_PATTERN = /\s/g

export type { ComparisonTab } from './comparison-view-store'
export type { WizardStep } from './wizard-draft'

/** State of the three-step application flow: variant, data, review. Progress is kept in the browser until sending. */
export class ApplicationWizardStore {
  readonly application: Application
  readonly offers: readonly ProductOffer[]
  step: WizardStep = 1
  maxStep: WizardStep = 1
  selectedOfferId: number | null = null
  form: WizardForm
  /** Fields the user has already left: only they show their problems before the first "Continue". */
  touchedFields: FormField[] = []
  hasTriedToContinue = false
  /** Grows with every refused "Continue": the screen moves the focus to the first problem. */
  invalidAttemptCount = 0
  readonly comparison = new ComparisonViewStore()
  isEditingParams = false
  isSubmitting = false
  errorMessage: string | null = null

  constructor(application: Application, offers: readonly ProductOffer[], defaults?: WizardDefaults) {
    this.application = application
    this.offers = offers
    this.form = createInitialForm(defaults)
    makeAutoObservable(this)
    this.restoreDraft()
  }

  get variants(): CreditVariants {
    return pickVariants(this.offers)
  }

  get selectedOffer(): ProductOffer | null {
    return this.offers.find(({ id }) => id === this.selectedOfferId) ?? null
  }

  get isSecured(): boolean {
    return this.selectedOffer !== null && this.selectedOffer.collateral > 0
  }

  get areAllConsentsGiven(): boolean {
    return CONSENTS.every(({ key }) => this.form.consents[key])
  }

  /** The stepper lets the user jump to a step that was already reached. */
  canGoToStep(step: WizardStep): boolean {
    return step !== this.step && step <= this.maxStep
  }

  /** Every problem of the data step, whether it is shown yet or not. */
  get issues(): ValidationIssue[] {
    return validateWizardForm(this.form, this.isSecured)
  }

  /** The problem of a field, once the user has been to the field or tried to continue. */
  getIssue(field: FormField): ValidationIssue | undefined {
    if (!this.hasTriedToContinue && !this.touchedFields.includes(field)) return undefined
    return this.issues.find((issue) => issue.field === field)
  }

  touchField(field: FormField): void {
    if (!this.touchedFields.includes(field)) this.touchedFields.push(field)
    if (isDigitsField(field)) this.normalizeDigits(field)
  }

  /** Called when the user leaves a number field: the zeros left by editing go away. */
  normalizeDigits(field: DigitsField): void {
    this.updateForm({ [field]: normalizeDigits(this.form[field]) })
  }

  pickOffer(offerId: number): void {
    this.selectedOfferId = offerId
    this.step = 2
    if (this.maxStep < 2) this.maxStep = 2
    this.persist()
  }

  /** Leaving the data step forward is allowed only when it is filled in correctly. */
  goToStep(step: WizardStep): void {
    if (step > this.step && this.step === 2 && !this.canLeaveDataStep()) return
    this.step = step
    this.persist()
  }

  goBack(): void {
    if (this.step === 3) this.step = 2
    else if (this.step === 2) this.step = 1
    this.persist()
  }

  goNext(): void {
    if (!this.canLeaveDataStep()) return
    this.step = 3
    this.maxStep = 3
    this.persist()
  }

  setRole(role: ApplicantRole): void {
    this.updateForm({ role })
  }

  setPhone(text: string): void {
    this.updateForm({ phone: formatPhone(text) })
  }

  /** An e-mail has no spaces; the note keeps them. */
  setText(field: 'email' | 'note', text: string): void {
    this.updateForm({ [field]: field === 'note' ? text.slice(0, NOTE_MAX_LENGTH) : text.replace(WHITESPACE_PATTERN, '') })
  }

  setDigits(field: DigitsField, text: string): void {
    this.updateForm({ [field]: groupDigits(text) })
  }

  setOtherLoans(answer: OtherLoansAnswer): void {
    this.updateForm({ otherLoans: answer })
  }

  setCollateralType(collateralType: CollateralType): void {
    this.updateForm({ collateralType })
  }

  setCollateralOwner(collateralOwner: CollateralOwner): void {
    this.updateForm({ collateralOwner })
  }

  setConsent(key: ConsentKey, isGiven: boolean): void {
    this.updateForm({ consents: { ...this.form.consents, [key]: isGiven } })
  }

  toggleAllConsents(): void {
    const isGiven = !this.areAllConsentsGiven
    this.updateForm({ consents: { personalData: isGiven, creditBureau: isGiven, fiscalData: isGiven } })
  }

  toggleParamsEditing(): void {
    this.isEditingParams = !this.isEditingParams
  }

  /** Sends the application to the bank. Returns it, or `null` when the request failed (see `errorMessage`). */
  async submit(): Promise<Application | null> {
    const offer = this.selectedOffer
    if (offer === null || !this.areAllConsentsGiven || this.isSubmitting) return null

    this.startSubmitting()
    try {
      const application = await selectApplicationProduct(this.application.id, offer)
      this.finishSubmitting()
      return application
    } catch (error) {
      this.failSubmitting(getErrorMessage(error))
      return null
    }
  }

  private canLeaveDataStep(): boolean {
    if (this.issues.length === 0) return true
    this.hasTriedToContinue = true
    this.invalidAttemptCount += 1
    return false
  }

  private updateForm(patch: Partial<WizardForm>): void {
    this.form = { ...this.form, ...patch }
    this.persist()
  }

  private restoreDraft(): void {
    const draft = readDraft(this.application.id)
    if (draft === null) return
    this.form = draft.form
    const hasSavedOffer = this.offers.some(({ id }) => id === draft.selectedOfferId)
    if (!hasSavedOffer) return
    this.selectedOfferId = draft.selectedOfferId
    this.step = draft.step
    this.maxStep = draft.maxStep
  }

  private persist(): void {
    const draft: SavedDraft = {
      step: this.step,
      maxStep: this.maxStep,
      selectedOfferId: this.selectedOfferId,
      form: this.form,
    }
    writeDraft(this.application.id, draft)
  }

  private startSubmitting(): void {
    this.isSubmitting = true
    this.errorMessage = null
  }

  private finishSubmitting(): void {
    this.isSubmitting = false
    removeDraft(this.application.id)
  }

  private failSubmitting(message: string): void {
    this.isSubmitting = false
    this.errorMessage = message
  }
}
