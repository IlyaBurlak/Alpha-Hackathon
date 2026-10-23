import { API_BASE_URL, EXTERNAL_API_BASE_URL, REQUEST_TIMEOUT_MS } from '@/shared/config'
import { isRecord, tokenStorage } from '@/shared/lib'

import { ApiError, NETWORK_ERROR_STATUS } from './errors'

const UNAUTHORIZED_STATUS = 401
const NETWORK_ERROR_MESSAGE = 'Нет связи с сервером. Проверьте соединение.'

type UnauthorizedHandler = () => void

interface HttpClientOptions {
  baseUrl: string
  /** Sends the auth token and reports 401 to the unauthorized handler. */
  isAuthorized: boolean
}

interface RequestOptions {
  method: 'GET' | 'POST'
  body?: unknown
}

async function readErrorMessage(response: Response): Promise<string> {
  const fallback = `Ошибка запроса (${response.status})`
  try {
    const payload: unknown = await response.json()
    return isRecord(payload) && typeof payload.error === 'string' ? payload.error : fallback
  } catch {
    // Non-JSON error bodies (e.g. plain "Unauthorized") carry no message worth showing.
    return fallback
  }
}

/**
 * Thin typed wrapper over `fetch`: adds base URL and auth header, turns failures into `ApiError`.
 * Returns `unknown` on purpose: each caller validates the payload at its own boundary.
 */
class HttpClient {
  private unauthorizedHandler: UnauthorizedHandler | null = null
  private readonly options: HttpClientOptions

  constructor(options: HttpClientOptions) {
    this.options = options
  }

  /** Registers a callback for expired or invalid tokens; returns a function that removes it. */
  setUnauthorizedHandler(handler: UnauthorizedHandler): () => void {
    this.unauthorizedHandler = handler
    return () => {
      if (this.unauthorizedHandler === handler) this.unauthorizedHandler = null
    }
  }

  get(path: string): Promise<unknown> {
    return this.request(path, { method: 'GET' })
  }

  post(path: string, body: unknown): Promise<unknown> {
    return this.request(path, { method: 'POST', body })
  }

  private async request(path: string, { method, body }: RequestOptions): Promise<unknown> {
    const token = this.options.isAuthorized ? tokenStorage.get() : null
    const headers = new Headers()
    if (body !== undefined) headers.set('Content-Type', 'application/json')
    if (token) headers.set('Authorization', `Bearer ${token}`)

    let response: Response
    try {
      response = await fetch(`${this.options.baseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })
    } catch {
      throw new ApiError(NETWORK_ERROR_STATUS, NETWORK_ERROR_MESSAGE)
    }

    if (!response.ok) {
      if (response.status === UNAUTHORIZED_STATUS && token) this.unauthorizedHandler?.()
      throw new ApiError(response.status, await readErrorMessage(response))
    }

    return response.json()
  }
}

/** Client of the main backend: authorized, signs the user out on 401. */
export const httpClient = new HttpClient({ baseUrl: API_BASE_URL, isAuthorized: true })

/** Client of the external-systems mock: public, no token. */
export const externalHttpClient = new HttpClient({ baseUrl: EXTERNAL_API_BASE_URL, isAuthorized: false })
