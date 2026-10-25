import type { QueueMode } from '@/entities/staff-application'
import { StaffQueue } from '@/widgets/staff-queue'

interface StaffQueuePageProps {
  mode: QueueMode
}

/** The queue of applications, the applications of the employee or the answered ones. */
export function StaffQueuePage({ mode }: StaffQueuePageProps) {
  return <StaffQueue mode={mode} />
}
