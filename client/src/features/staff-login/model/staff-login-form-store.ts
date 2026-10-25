import { makeAutoObservable } from 'mobx'

import type { EmployeeStore } from '@/entities/employee'
import { USER_ROLES, requestEmployeeToken } from '@/entities/session'
import type { SessionStore } from '@/entities/session'
import { getErrorMessage } from '@/shared/api'

const EMPTY_FIELDS_MESSAGE = 'Введите логин и пароль'
const NOT_AN_EMPLOYEE_MESSAGE = 'Этот аккаунт не относится к сотрудникам банка'

export class StaffLoginFormStore {
  login = ''
  password = ''
  isSubmitting = false
  errorMessage: string | null = null
  /** The fields to mark red: the one that is empty, or the password after a wrong login. */
  invalidFields: ReadonlyArray<'login' | 'password'> = []

  private readonly session: SessionStore
  private readonly employee: EmployeeStore

  constructor(session: SessionStore, employee: EmployeeStore) {
    this.session = session
    this.employee = employee
    makeAutoObservable<StaffLoginFormStore, 'session' | 'employee'>(this, { session: false, employee: false })
  }

  setLogin(login: string): void {
    this.login = login
  }

  setPassword(password: string): void {
    this.password = password
  }

  /** Returns `true` when the employee is signed in. */
  async submit(): Promise<boolean> {
    if (this.isSubmitting) return false
    const login = this.login.trim()
    if (login === '' || this.password === '') {
      this.fail(EMPTY_FIELDS_MESSAGE, [...(login === '' ? ['login' as const] : []), ...(this.password === '' ? ['password' as const] : [])])
      return false
    }

    this.startSubmitting()
    try {
      const token = await requestEmployeeToken({ login, password: this.password })
      this.session.signIn(token)
      const claims = this.session.claims
      if (claims?.role !== USER_ROLES.employee || claims.login === null) {
        this.session.signOut()
        this.fail(NOT_AN_EMPLOYEE_MESSAGE, [])
        return false
      }
      this.employee.setLogin(claims.login)
    } catch (error) {
      this.fail(getErrorMessage(error), ['password'])
      return false
    }
    this.finishSubmitting()
    return true
  }

  private startSubmitting(): void {
    this.isSubmitting = true
    this.errorMessage = null
    this.invalidFields = []
  }

  private finishSubmitting(): void {
    this.isSubmitting = false
  }

  private fail(message: string, invalidFields: ReadonlyArray<'login' | 'password'>): void {
    this.isSubmitting = false
    this.errorMessage = message
    this.invalidFields = invalidFields
  }
}
