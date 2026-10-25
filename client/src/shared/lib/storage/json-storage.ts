/** `localStorage` wrapper that survives private mode and blocked storage; values come back as `unknown` to be validated. */
export const jsonStorage = {
  read(key: string): unknown {
    try {
      const raw = localStorage.getItem(key)
      return raw === null ? null : JSON.parse(raw)
    } catch {
      return null
    }
  },
  write(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Without storage the draft lives only until reload.
    }
  },
  remove(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch {
      // Nothing to remove when storage is unavailable.
    }
  },
}
