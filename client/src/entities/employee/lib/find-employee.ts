import { MOCK_EMPLOYEES } from '../api/mocks/mock-employees'
import type { Employee } from '../model/types'

const UNKNOWN_EMPLOYEE_POSITION = 'Сотрудник банка'
const INITIALS_LENGTH = 2

export function getEmployees(): readonly Employee[] {
  return MOCK_EMPLOYEES
}

export function findEmployee(id: string): Employee | undefined {
  return MOCK_EMPLOYEES.find((employee) => employee.id === id)
}

/** The employee behind a token. A login the directory does not know still gets a profile, built from the login. */
export function resolveEmployeeByLogin(login: string): Employee {
  const normalized = login.trim().toLowerCase()
  const known = MOCK_EMPLOYEES.find((employee) => employee.login === normalized)
  if (known) return known
  return {
    id: normalized,
    login: normalized,
    name: login,
    initials: login.slice(0, INITIALS_LENGTH).toUpperCase(),
    position: UNKNOWN_EMPLOYEE_POSITION,
  }
}
