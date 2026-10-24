import { describe, expect, it } from 'vitest'

import { readSessionClaims } from '../../lib/read-session-claims'
import { createDemoStaffToken, isDemoStaff } from './mock-demo-staff'

describe('demo staff', () => {
  it('accepts the demo logins with the demo password, in any letter case', () => {
    expect(isDemoStaff('ivanova', 'demo2026')).toBe(true)
    expect(isDemoStaff(' Kim ', 'demo2026')).toBe(true)
  })

  it.each([
    ['ivanova', 'wrong'],
    ['alfaOperator1', 'demo2026'],
    ['', ''],
  ])('refuses %s with %s', (login, password) => {
    expect(isDemoStaff(login, password)).toBe(false)
  })

  it('issues a token that selects the employee cabinet', () => {
    expect(readSessionClaims(createDemoStaffToken('Ivanova'))).toEqual({ login: 'ivanova', role: 'employee' })
  })
})
