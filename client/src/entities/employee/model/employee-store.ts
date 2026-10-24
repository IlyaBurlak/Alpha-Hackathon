import { makeAutoObservable } from 'mobx'

import { resolveEmployeeByLogin } from '../lib/find-employee'
import type { Employee } from './types'

/** The bank employee who is signed in. */
export class EmployeeStore {
  login: string | null = null

  constructor() {
    makeAutoObservable(this)
  }

  get current(): Employee | null {
    return this.login === null ? null : resolveEmployeeByLogin(this.login)
  }

  setLogin(login: string | null): void {
    this.login = login
  }
}
