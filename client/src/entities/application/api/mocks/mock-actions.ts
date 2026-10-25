/**
 * MOCK: the backend cannot withdraw an application, sign a contract or drop a draft yet
 * (docs/backend-requirements.md, 2.1.3, 2.1.7 and 2.1.8). The actions are remembered in the browser only.
 */
import { saveLocalDetails } from '../../lib/local-details/local-details'

export function withdrawApplication(applicationId: number): void {
  saveLocalDetails(applicationId, { withdrawnAt: Date.now() })
}

export function signApplication(applicationId: number): void {
  saveLocalDetails(applicationId, { signedAt: Date.now() })
}

/** Hides a draft from the lists, as if it was deleted. */
export function discardApplication(applicationId: number): void {
  saveLocalDetails(applicationId, { isDiscarded: true })
}
