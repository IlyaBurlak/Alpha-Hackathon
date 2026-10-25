interface JsonStorage {
  read: (key: string) => unknown
  write: (key: string, value: unknown) => void
  remove: (key: string) => void
}

/** A wrapper that survives private mode and blocked storage; values come back as `unknown` to be validated. */
function createJsonStorage(getStorage: () => Storage): JsonStorage {
  return {
    read(key) {
      try {
        const raw = getStorage().getItem(key)
        return raw === null ? null : JSON.parse(raw)
      } catch {
        return null
      }
    },
    write(key, value) {
      try {
        getStorage().setItem(key, JSON.stringify(value))
      } catch {
        // Without storage the draft lives only until reload.
      }
    },
    remove(key) {
      try {
        getStorage().removeItem(key)
      } catch {
        // Nothing to remove when storage is unavailable.
      }
    },
  }
}

/** Data that may stay in the browser between visits and holds nothing personal (flags, the mock database). */
export const jsonStorage = createJsonStorage(() => localStorage)

/** Personal data of the user (a draft with a phone and an e-mail): it is gone when the tab is closed or the user signs out. */
export const sessionJsonStorage = {
  ...createJsonStorage(() => sessionStorage),
  /** Forgets every personal draft of the tab. */
  clear(): void {
    try {
      sessionStorage.clear()
    } catch {
      // Nothing to clear when storage is unavailable.
    }
  },
}
