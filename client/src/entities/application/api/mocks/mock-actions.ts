/**
 * MOCK: the backend cannot drop a draft yet (docs/backend-requirements.md, 2.1.3). The action is remembered in the
 * browser only.
 */
import { saveLocalDetails } from '../../lib/local-details/local-details'

/** Hides a draft from the lists, as if it was deleted. */
export function discardApplication(applicationId: number): void {
  saveLocalDetails(applicationId, { isDiscarded: true })
}
