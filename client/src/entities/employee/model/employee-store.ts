import { makeAutoObservable, runInAction } from 'mobx'

import { getCurrentEmployee, hasBackendProfile } from '../api/get-current-employee'
import { resolveEmployeeByLogin } from '../lib/find-employee'
import type { Employee } from './types'

/** The bank employee who is signed in. */
export class EmployeeStore {
  login: string | null = null
  /** The profile from the backend; until it arrives (and for the demo employees) the directory is used. */
  profile: Employee | null = null

  constructor() {
    makeAutoObservable(this)
  }

  get current(): Employee | null {
    if (this.login === null) return null
    return this.profile ?? resolveEmployeeByLogin(this.login)
  }

  setLogin(login: string | null): void {
    if (login !== this.login) this.profile = null
    this.login = login
  }

  /** Asks the backend for the name of the operator; a failure keeps the directory profile. */
  async loadProfile(): Promise<void> {
    if (this.login === null || !hasBackendProfile()) return
    const login = this.login
    try {
      const profile = await getCurrentEmployee()
      runInAction(() => {
        if (this.login === login) this.profile = profile
      })
    } catch {
      // The directory profile built from the login is still correct; the name is only less precise.
    }
  }
}
