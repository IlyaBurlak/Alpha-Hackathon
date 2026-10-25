/** Same-origin prefix: proxied by Vite in dev and by nginx in production. */
export const API_BASE_URL = '/api'

/** Admin panel talks to the external-systems mock through this proxied prefix. */
export const EXTERNAL_API_BASE_URL = '/external-api'

export const REQUEST_TIMEOUT_MS = 10_000
