const TOKEN_KEY = 'auth-token'

/**
 * The token lives in `sessionStorage`: it belongs to one tab and is gone when the tab is closed, so a token does not
 * stay on a shared computer. An earlier version kept it in `localStorage`, where it outlived the session; such a copy
 * is removed on every access.
 */
function removeLegacyToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Without localStorage there is no old copy to remove.
  }
}

export const tokenStorage = {
  get(): string | null {
    removeLegacyToken()
    try {
      return sessionStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set(token: string): void {
    removeLegacyToken()
    try {
      sessionStorage.setItem(TOKEN_KEY, token)
    } catch {
      // The session then lives only until reload.
    }
  },
  clear(): void {
    removeLegacyToken()
    try {
      sessionStorage.removeItem(TOKEN_KEY)
    } catch {
      // Nothing to clear when storage is unavailable.
    }
  },
}
