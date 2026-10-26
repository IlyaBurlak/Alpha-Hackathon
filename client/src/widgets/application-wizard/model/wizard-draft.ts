import { isRecord, sessionJsonStorage } from '@/shared/lib'

import { parseForm } from './wizard-form'
import type { WizardForm } from './wizard-form'

const DRAFT_KEY_PREFIX = 'application-wizard:'

export type WizardStep = 1 | 2 | 3

const WIZARD_STEPS: readonly unknown[] = [1, 2, 3]

function isWizardStep(value: unknown): value is WizardStep {
  return WIZARD_STEPS.includes(value)
}

/** Progress of the flow kept in the browser tab until the application is sent. */
export interface SavedDraft {
  step: WizardStep
  maxStep: WizardStep
  selectedOfferId: number | null
  form: WizardForm
}

function getDraftKey(applicationId: number): string {
  return `${DRAFT_KEY_PREFIX}${applicationId}`
}

function parseDraft(value: unknown): SavedDraft | null {
  if (!isRecord(value)) return null
  const { step, maxStep, selectedOfferId } = value
  const form = parseForm(value.form)
  if (form === null || !isWizardStep(step) || !isWizardStep(maxStep)) return null
  if (!(selectedOfferId === null || typeof selectedOfferId === 'number')) return null
  return { step, maxStep, selectedOfferId, form }
}

/** The saved draft of an application, or `null` when there is none or it is broken. */
export function readDraft(applicationId: number): SavedDraft | null {
  return parseDraft(sessionJsonStorage.read(getDraftKey(applicationId)))
}

export function writeDraft(applicationId: number, draft: SavedDraft): void {
  sessionJsonStorage.write(getDraftKey(applicationId), draft)
}

export function removeDraft(applicationId: number): void {
  sessionJsonStorage.remove(getDraftKey(applicationId))
}
