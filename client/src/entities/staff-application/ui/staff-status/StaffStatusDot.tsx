import { StatusDot } from '@/shared/ui'

import { STAFF_STATUS_VIEWS } from '../../lib/status-view'
import type { StaffStatus } from '../../model/types'

interface StaffStatusDotProps {
  status: StaffStatus
}

export function StaffStatusDot({ status }: StaffStatusDotProps) {
  const { label, tone, isBlinking } = STAFF_STATUS_VIEWS[status]
  return (
    <StatusDot tone={tone} size="small" isBlinking={isBlinking}>
      {label}
    </StatusDot>
  )
}
