import { ApiError, UnexpectedResponseError, externalHttpClient } from '@/shared/api'
import { isRecord } from '@/shared/lib'

import type { ExternalServiceId, ServiceAvailability } from '../model/types'

const SERVICE_UNAVAILABLE_STATUS = 503

// The mock has no "current status" endpoint: availability is read by probing a regular method,
// which answers 503 while the service is switched off. The probe needs any known INN.
const PROBE_INN = '7701234568'

const ENDPOINTS: Record<ExternalServiceId, { probePath: string; togglePath: string }> = {
  bank: { probePath: '/banks/products', togglePath: '/banks/setActive' },
  'credit-bureau': {
    probePath: `/credit-bureaus/history?inn=${PROBE_INN}`,
    togglePath: '/credit-bureaus/setActive',
  },
  register: {
    probePath: `/register/legal?inn=${PROBE_INN}`,
    togglePath: '/register/setActive',
  },
}

export async function fetchAvailability(id: ExternalServiceId): Promise<ServiceAvailability> {
  try {
    await externalHttpClient.get(ENDPOINTS[id].probePath)
    return 'active'
  } catch (error) {
    if (error instanceof ApiError && error.status === SERVICE_UNAVAILABLE_STATUS) return 'inactive'
    throw error
  }
}

export async function updateAvailability(id: ExternalServiceId, isActive: boolean): Promise<void> {
  const payload = await externalHttpClient.post(ENDPOINTS[id].togglePath, { isActive })
  if (!isRecord(payload) || payload.message !== 'ok') {
    throw new UnexpectedResponseError('setActive did not confirm the change')
  }
}
