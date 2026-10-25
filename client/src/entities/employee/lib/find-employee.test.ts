import { describe, expect, it } from 'vitest'

import { findEmployee, getEmployees, resolveEmployeeByLogin } from './find-employee'

describe('employee directory', () => {
  it('lists the employees and finds one by id', () => {
    expect(getEmployees().length).toBeGreaterThanOrEqual(3)
    expect(findEmployee('u1')?.name).toBe('Мария Иванова')
    expect(findEmployee('nobody')).toBeUndefined()
  })

  it('resolves a login in any letter case', () => {
    expect(resolveEmployeeByLogin('alfaOperator1').id).toBe('op1')
    expect(resolveEmployeeByLogin(' IVANOVA ').id).toBe('u1')
  })

  it('builds a profile for an unknown login', () => {
    expect(resolveEmployeeByLogin('newbie')).toMatchObject({ id: 'newbie', name: 'newbie', initials: 'NE' })
  })
})
