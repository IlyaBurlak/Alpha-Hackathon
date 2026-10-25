const TOKEN_KEY = 'auth-token'

interface TokenStorageOptions {
  /** `true` keeps the token after the tab is closed ("remember me"); by default it lives only in the tab. */
  isPersistent: boolean
}

function readFrom(storage: () => Storage): string | null {
  try {
    return storage().getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function removeFrom(storage: () => Storage): void {
  try {
    storage().removeItem(TOKEN_KEY)
  } catch {
    // Nothing to clear when storage is unavailable.
  }
}

/**
 * By default the token is kept in `sessionStorage`: it belongs to one tab and is gone when the tab is closed, so it does
 * not stay on a shared computer. Only when the user asks to be remembered does it go to `localStorage`.
 */
export const tokenStorage = {
  get(): string | null {
    return readFrom(() => sessionStorage) ?? readFrom(() => localStorage)
  },
  set(token: string, { isPersistent }: TokenStorageOptions = { isPersistent: false }): void {
    this.clear()
    try {
      const storage = isPersistent ? localStorage : sessionStorage
      storage.setItem(TOKEN_KEY, token)
    } catch {
      // The session then lives only until reload.
    }
  },
  clear(): void {
    removeFrom(() => sessionStorage)
    removeFrom(() => localStorage)
  },
}
