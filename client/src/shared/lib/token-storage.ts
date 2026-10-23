const TOKEN_KEY = 'auth-token'

export const tokenStorage = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token)
    } catch {
      // The session then lives only until reload.
    }
  },
  clear(): void {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch {
      // Nothing to clear when storage is unavailable.
    }
  },
}
