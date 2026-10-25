const TOKEN_KEY = 'auth-token'

interface TokenStorageOptions {
  /** `false` keeps the token only until the tab is closed ("do not remember me"). */
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

export const tokenStorage = {
  get(): string | null {
    return readFrom(() => localStorage) ?? readFrom(() => sessionStorage)
  },
  set(token: string, { isPersistent }: TokenStorageOptions = { isPersistent: true }): void {
    this.clear()
    try {
      const storage = isPersistent ? localStorage : sessionStorage
      storage.setItem(TOKEN_KEY, token)
    } catch {
      // The session then lives only until reload.
    }
  },
  clear(): void {
    removeFrom(() => localStorage)
    removeFrom(() => sessionStorage)
  },
}
