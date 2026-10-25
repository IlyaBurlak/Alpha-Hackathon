import { makeAutoObservable } from 'mobx'

import { tokenStorage } from '@/shared/lib'

import { readSessionClaims } from '../lib/read-session-claims'
import type { SessionClaims } from '../lib/read-session-claims'

interface SignInOptions {
  /** `false` forgets the session when the tab is closed. */
  isPersistent?: boolean
}

export class SessionStore {
  token: string | null = tokenStorage.get()

  constructor() {
    makeAutoObservable(this)
  }

  get isAuthenticated(): boolean {
    return this.token !== null
  }

  /** The login and the role the token was issued for; `null` while signed out. */
  get claims(): SessionClaims | null {
    return this.token === null ? null : readSessionClaims(this.token)
  }

  signIn(token: string, { isPersistent = true }: SignInOptions = {}): void {
    this.token = token
    tokenStorage.set(token, { isPersistent })
  }

  signOut(): void {
    this.token = null
    tokenStorage.clear()
  }
}
