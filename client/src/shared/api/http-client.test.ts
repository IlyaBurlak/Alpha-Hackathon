import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError, NETWORK_ERROR_STATUS, UnexpectedResponseError } from './errors'
import { httpClient } from './http-client'

const fetchMock = vi.fn<typeof fetch>()

function respondWith(body: unknown, status = 200): void {
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(body), { status }))
}

function lastRequest(): { url: string; init: RequestInit } {
  const [url, init] = fetchMock.mock.lastCall ?? []
  return { url: String(url), init: init ?? {} }
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  vi.stubGlobal('sessionStorage', { getItem: vi.fn(() => null) })
})

afterEach(() => {
  fetchMock.mockReset()
})

describe('httpClient: requests', () => {
  it('prefixes the path with /api and parses JSON', async () => {
    respondWith({ ok: true })

    await expect(httpClient.get('/applications/my')).resolves.toEqual({ ok: true })
    expect(lastRequest().url).toBe('/api/applications/my')
    expect(lastRequest().init.method).toBe('GET')
  })

  it('sends a JSON body with POST', async () => {
    respondWith({})

    await httpClient.post('/applications', { sum: 1 })

    const { init } = lastRequest()
    expect(init.method).toBe('POST')
    expect(init.body).toBe('{"sum":1}')
    expect(new Headers(init.headers).get('Content-Type')).toBe('application/json')
  })

  it('sends PUT without a body', async () => {
    respondWith({})

    await httpClient.put('/applications?applicationId=1&productId=2')

    const { url, init } = lastRequest()
    expect(url).toBe('/api/applications?applicationId=1&productId=2')
    expect(init.method).toBe('PUT')
    expect(init.body).toBeUndefined()
  })
})

describe('httpClient: authorization', () => {
  it('adds the bearer token when there is one', async () => {
    vi.stubGlobal('sessionStorage', { getItem: vi.fn(() => 'secret-token') })
    respondWith({})

    await httpClient.get('/users/info')

    expect(new Headers(lastRequest().init.headers).get('Authorization')).toBe('Bearer secret-token')
  })

  it('does not add the header without a token', async () => {
    respondWith({})

    await httpClient.get('/users/info')

    expect(new Headers(lastRequest().init.headers).has('Authorization')).toBe(false)
  })

  it('reports 401 to the unauthorized handler only when a token was sent', async () => {
    const handler = vi.fn()
    const removeHandler = httpClient.setUnauthorizedHandler(handler)

    respondWith({ error: 'Unauthorized' }, 401)
    await expect(httpClient.get('/users/info')).rejects.toBeInstanceOf(ApiError)
    expect(handler).not.toHaveBeenCalled()

    vi.stubGlobal('sessionStorage', { getItem: vi.fn(() => 'expired') })
    respondWith({ error: 'Unauthorized' }, 401)
    await expect(httpClient.get('/users/info')).rejects.toBeInstanceOf(ApiError)
    expect(handler).toHaveBeenCalledOnce()

    removeHandler()
  })
})

describe('httpClient: errors', () => {
  it('uses the backend `error` field as the message', async () => {
    respondWith({ error: 'Выбранный продукт недоступен для данной заявки' }, 500)

    await expect(httpClient.put('/applications')).rejects.toMatchObject({
      status: 500,
      message: 'Выбранный продукт недоступен для данной заявки',
    })
  })

  it('falls back to a generic message for non-JSON error bodies', async () => {
    fetchMock.mockResolvedValueOnce(new Response('Unauthorized', { status: 403 }))

    await expect(httpClient.get('/users/info')).rejects.toMatchObject({
      status: 403,
      message: 'Ошибка запроса (403)',
    })
  })

  it('turns network failures into an ApiError with the network status', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    await expect(httpClient.get('/users/info')).rejects.toMatchObject({ status: NETWORK_ERROR_STATUS })
  })

  it('reports a successful response with a broken body as an unexpected response', async () => {
    fetchMock.mockResolvedValueOnce(new Response('<html>', { status: 200 }))

    await expect(httpClient.get('/applications/my')).rejects.toBeInstanceOf(UnexpectedResponseError)
  })
})
