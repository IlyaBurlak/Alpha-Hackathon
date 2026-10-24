import { describe, expect, it } from 'vitest'

import { APPLICATION_STATUSES } from '../../model/types'
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_TONES,
  TIMELINE_STEPS,
  getTimelineStates,
  isActiveStatus,
} from './application-status'

describe('application status views', () => {
  it('has a label and a tone for every status', () => {
    const statuses = Object.values(APPLICATION_STATUSES).sort()

    expect(Object.keys(APPLICATION_STATUS_LABELS).sort()).toEqual(statuses)
    expect(Object.keys(APPLICATION_STATUS_TONES).sort()).toEqual(statuses)
  })
})

describe('isActiveStatus', () => {
  it('keeps drafts, reviewed and approved applications active', () => {
    expect(isActiveStatus('DRAFT')).toBe(true)
    expect(isActiveStatus('SUBMITTED')).toBe(true)
    expect(isActiveStatus('APPROVED')).toBe(true)
  })

  it('keeps a payout active', () => {
    expect(isActiveStatus('PAYOUT')).toBe(true)
  })

  it.each(['REJECTED', 'WITHDRAWN', 'ISSUED'] as const)('finishes %s applications', (status) => {
    expect(isActiveStatus(status)).toBe(false)
  })
})

describe('getTimelineStates', () => {
  it('has a state for every timeline step', () => {
    for (const status of Object.values(APPLICATION_STATUSES)) {
      expect(getTimelineStates(status)).toHaveLength(TIMELINE_STEPS.length)
    }
  })

  it('shows the review in progress for a sent application', () => {
    expect(getTimelineStates('SUBMITTED')).toEqual(['done', 'now', 'todo', 'todo', 'todo'])
  })

  it('waits for the signature after approval and stops at the decision after rejection', () => {
    expect(getTimelineStates('APPROVED')[3]).toBe('wait')
    expect(getTimelineStates('REJECTED')[2]).toBe('stop')
  })
})
