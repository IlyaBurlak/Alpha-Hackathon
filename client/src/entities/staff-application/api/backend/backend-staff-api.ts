import { ApiError, httpClient, readArray, readRecord } from '@/shared/api'
import { decodeJwtPayload, isRecord, tokenStorage } from '@/shared/lib'

import type { Decision } from '../../model/types'
import { operatorToEmployeeId, toStaffApplicationDto } from './to-staff-dto'

const APPLICATIONS_PATH = '/applications'
const UNSUPPORTED_STATUS = 501
const DRAFT_STATUS = 'DRAFT'
const OFFER_PAYMENTS = 'ежемесячно, равными долями'
const REASON_SEPARATOR = '. '

/** Real operators carry the numeric `id` of the backend in the token; the demo employees of the design do not. */
export function getBackendOperatorEmployeeId(): string | null {
  const token = tokenStorage.get()
  const claims = token ? decodeJwtPayload(token) : null
  if (claims?.isAdmin !== true || typeof claims.id !== 'number') return null
  return operatorToEmployeeId(claims.id)
}

function toUnsupportedError(action: string): ApiError {
  return new ApiError(UNSUPPORTED_STATUS, `${action} пока недоступно на сервере`)
}

interface CachedScore {
  /** What in the list item can change the card; while it stays the same the cached `/score` is still true. */
  signature: string
  scored: unknown
}

const scoreCache = new Map<string, CachedScore>()

function readOptionalField(source: Record<string, unknown>, key: string): string {
  const value = source[key]
  return typeof value === 'string' || typeof value === 'number' ? String(value) : ''
}

/** Status, scoring stage, responsible operator and comment: any decision, "take" or finished scoring changes one of them. */
function getSignature(listItem: Record<string, unknown>): string {
  const score = isRecord(listItem.applicationScore) ? listItem.applicationScore : {}
  const operator = isRecord(listItem.operator) ? listItem.operator : {}
  return [
    readOptionalField(listItem, 'status'),
    readOptionalField(score, 'status'),
    readOptionalField(operator, 'id'),
    readOptionalField(listItem, 'solutionComment'),
    readOptionalField(listItem, 'productId'),
  ].join('|')
}

/** The `/score` form of an application has the register and credit bureau data; the list form has not. */
async function loadScoredApplication(listItem: Record<string, unknown>, id: string): Promise<unknown> {
  const signature = getSignature(listItem)
  const cached = scoreCache.get(id)
  if (cached?.signature === signature) return cached.scored
  try {
    const scored = await httpClient.get(`${APPLICATIONS_PATH}/${id}/score`)
    scoreCache.set(id, { signature, scored })
    return scored
  } catch {
    // The list item is still a valid application; the card then shows placeholders instead of the register data.
    return listItem
  }
}

/**
 * GET /applications/all; `/applications/:id/score` is requested only for applications that are new or changed since
 * the last load, so a refresh of an unchanged queue is one request. Drafts are not shown to employees.
 */
export async function fetchBackendApplications(now: number): Promise<unknown[]> {
  const items = readArray(await httpClient.get(`${APPLICATIONS_PATH}/all`), 'applications')
  const sent = items.filter((item): item is Record<string, unknown> => isRecord(item) && item.status !== DRAFT_STATUS)
  const scored = await Promise.all(sent.map((item) => loadScoredApplication(item, String(readRecord(item, 'application').id))))
  return scored.map((item) => toStaffApplicationDto(item, now)).filter((dto) => dto !== null)
}

/** GET /applications/:id/score */
export async function fetchBackendApplication(applicationId: string, now: number): Promise<unknown> {
  const dto = toStaffApplicationDto(await httpClient.get(`${APPLICATIONS_PATH}/${applicationId}/score`), now)
  if (dto === null) throw new ApiError(404, 'Заявка ещё не отправлена клиентом')
  return dto
}

/** POST /applications/:id/take: the operator of the token becomes the one responsible. */
export async function takeBackendApplication(applicationId: string): Promise<void> {
  await httpClient.post(`${APPLICATIONS_PATH}/${applicationId}/take`, {})
}

/** POST /applications/:id/restart: the backend runs the whole scoring again and overwrites the previous data. */
export async function restartBackendScoring(applicationId: string): Promise<void> {
  await httpClient.post(`${APPLICATIONS_PATH}/${applicationId}/restart`, {})
}

function toSolutionBody(decision: Decision): Record<string, unknown> {
  switch (decision.type) {
    case 'approve':
      return { status: 'APPROVED', comment: decision.comment }
    case 'reject':
      return { status: 'REJECTED', comment: decision.comment ? `${decision.reason}${REASON_SEPARATOR}${decision.comment}` : decision.reason }
    case 'offer':
      return {
        status: 'SPECIALPRODUCTOFFERED',
        comment: decision.comment,
        product: {
          name: 'Особое предложение',
          persentage: decision.rate,
          sum: decision.amount,
          collateral: 0,
          payments: OFFER_PAYMENTS,
          creditTime: { units: 'MONTH', value: decision.termInMonths },
        },
      }
    case 'clarify':
      throw toUnsupportedError('Запрос данных')
  }
}

/** POST /applications/:id/solution; the backend lets only the responsible operator decide. */
export async function sendBackendDecision(applicationId: string, decision: Decision): Promise<void> {
  const body = toSolutionBody(decision)
  await httpClient.post(`${APPLICATIONS_PATH}/${applicationId}/solution`, body)
}

export function rejectUnsupportedReopen(): never {
  throw toUnsupportedError('Изменение решения')
}

export function rejectUnsupportedAssignment(): never {
  throw toUnsupportedError('Назначение другого сотрудника и снятие ответственного')
}

export function rejectUnsupportedRestart(): never {
  throw toUnsupportedError('Перезапуск скоринга')
}
