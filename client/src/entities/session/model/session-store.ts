import { makeAutoObservable } from 'mobx'

import { sessionJsonStorage, tokenStorage } from '@/shared/lib'

import { readSessionClaims } from '../lib/read-session-claims'
import { isTokenExpired } from '../lib/token-expiry'
import type { SessionClaims } from '../lib/read-session-claims'

interface SignInOptions {
  /** `true` keeps the session after the tab is closed. */
  isPersistent?: boolean
}

export class SessionStore {
  token: string | null = null

  constructor() {
    const stored = tokenStorage.get()
    // A token that has expired while the tab was open is forgotten at once, not at the first request that fails.
    if (stored !== null && !isTokenExpired(stored)) this.token = stored
    else if (stored !== null) this.signOut()
    makeAutoObservable(this)
  }

  /** The login and the role the token was issued for; `null` while signed out. */
  get claims(): SessionClaims | null {
    return this.token === null ? null : readSessionClaims(this.token)
  }

  signIn(token: string, { isPersistent = false }: SignInOptions = {}): void {
    this.token = token
    tokenStorage.set(token, { isPersistent })
  }

  /** Forgets the token and the personal drafts kept for the tab. */
  signOut(): void {
    this.token = null
    tokenStorage.clear()
    sessionJsonStorage.clear()
  }
}
