import { makeAutoObservable } from 'mobx'

import { requestToken } from '@/entities/session'
import type { SessionStore } from '@/entities/session'
import type { UserStore } from '@/entities/user'
import { getErrorMessage } from '@/shared/api'

export class LoginFormStore {
  login = ''
  password = ''
  isSubmitting = false
  errorMessage: string | null = null

  private readonly session: SessionStore
  private readonly user: UserStore

  constructor(session: SessionStore, user: UserStore) {
    this.session = session
    this.user = user
    makeAutoObservable<LoginFormStore, 'session' | 'user'>(this, { session: false, user: false })
  }

  get canSubmit(): boolean {
    return this.login.trim().length > 0 && this.password.length > 0 && !this.isSubmitting
  }

  setLogin(login: string): void {
    this.login = login
  }

  setPassword(password: string): void {
    this.password = password
  }

  async submit(): Promise<void> {
    if (!this.canSubmit) return

    this.startSubmitting()
    try {
      const token = await requestToken({ login: this.login.trim(), password: this.password })
      this.session.signIn(token)
      await this.user.load()
    } catch (error) {
      this.failSubmitting(getErrorMessage(error))
      return
    }
    this.finishSubmitting()
  }

  private startSubmitting(): void {
    this.isSubmitting = true
    this.errorMessage = null
  }

  private failSubmitting(message: string): void {
    this.isSubmitting = false
    this.errorMessage = message
  }

  private finishSubmitting(): void {
    this.isSubmitting = false
  }
}
