import type { ServiceState } from '../model/types'

export type StatusColor = 'green' | 'red' | 'orange' | 'grey'

export interface ServiceStatusView {
  label: string
  color: StatusColor
}

export function getServiceStatusView(state: ServiceState): ServiceStatusView {
  switch (state.kind) {
    case 'loading':
      return { label: 'Проверка…', color: 'grey' }
    case 'error':
      return { label: 'Нет связи', color: 'orange' }
    case 'ready':
      return state.availability === 'active'
        ? { label: 'Работает', color: 'green' }
        : { label: 'Отключён', color: 'red' }
  }
}
