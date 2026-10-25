import { Switch } from '@alfalab/core-components/switch'
import { observer } from 'mobx-react-lite'

import { useExternalServicesStore } from '@/entities/external-service'
import type { ExternalServiceId } from '@/entities/external-service'

interface ServiceAvailabilitySwitchProps {
  serviceId: ExternalServiceId
}

export const ServiceAvailabilitySwitch = observer(function ServiceAvailabilitySwitch({
  serviceId,
}: ServiceAvailabilitySwitchProps) {
  const store = useExternalServicesStore()
  const state = store.states[serviceId]

  const isReady = state.kind === 'ready'
  const isActive = isReady && state.availability === 'active'
  const isUpdating = isReady && state.isUpdating

  return (
    <Switch
      block
      reversed
      align="center"
      checked={isActive}
      disabled={!isReady || isUpdating}
      label={isActive ? 'Сервис доступен' : 'Сервис отключён'}
      hint={isUpdating ? 'Применяем изменение…' : undefined}
      onChange={() => void store.toggle(serviceId)}
    />
  )
})
