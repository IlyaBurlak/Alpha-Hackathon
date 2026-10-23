import { makeAutoObservable } from 'mobx'

import { tokenStorage } from '@/shared/lib'

export class SessionStore {
  token: string | null = tokenStorage.get()

  constructor() {
    makeAutoObservable(this)
  }

  get isAuthenticated(): boolean {
    return this.token !== null
  }

  signIn(token: string): void {
    this.token = token
    tokenStorage.set(token)
  }

  signOut(): void {
    this.token = null
    tokenStorage.clear()
  }
}
