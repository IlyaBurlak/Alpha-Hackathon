export const EXTERNAL_SERVICE_IDS = ['bank', 'credit-bureau', 'register'] as const

export type ExternalServiceId = (typeof EXTERNAL_SERVICE_IDS)[number]

export type ServiceAvailability = 'active' | 'inactive'

export interface ExternalServiceInfo {
  id: ExternalServiceId
  title: string
  description: string
}

/** What the panel knows about one service right now. */
export type ServiceState =
  | { kind: 'loading' }
  | { kind: 'ready'; availability: ServiceAvailability; isUpdating: boolean; notice: string | null }
  | { kind: 'error'; message: string }
