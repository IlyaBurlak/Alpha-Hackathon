import { describe, expect, it } from 'vitest'

import { AsyncResource } from './async-resource'
import { ApiError } from './errors'

interface Box {
  value: number
}

describe('AsyncResource', () => {
  it('goes idle -> loading -> success and spreads the value into the state', async () => {
    const resource = new AsyncResource<Box>()
    expect(resource.state).toEqual({ status: 'idle' })

    const loading = resource.load(() => Promise.resolve({ value: 1 }))
    expect(resource.state).toEqual({ status: 'loading' })
    await loading

    expect(resource.state).toEqual({ status: 'success', value: 1 })
  })

  it('shows the message of an ApiError and a generic one for other failures', async () => {
    const resource = new AsyncResource<Box>()

    await resource.load(() => Promise.reject(new ApiError(500, 'Нет доступа')))
    expect(resource.state).toEqual({ status: 'error', message: 'Нет доступа' })

    await resource.load(() => Promise.reject(new Error('boom')))
    expect(resource.state).toEqual({ status: 'error', message: 'Что-то пошло не так. Попробуйте ещё раз.' })
  })

  it('refreshes quietly: returns the new value, and keeps the old data when the request fails', async () => {
    const resource = new AsyncResource<Box>()
    await resource.load(() => Promise.resolve({ value: 1 }))

    await expect(resource.refresh(() => Promise.resolve({ value: 2 }))).resolves.toEqual({ value: 2 })
    expect(resource.state).toEqual({ status: 'success', value: 2 })

    await expect(resource.refresh(() => Promise.reject(new Error('fail')))).resolves.toBeNull()
    expect(resource.state).toEqual({ status: 'success', value: 2 })
  })

  it('sets a value at hand and resets to idle', () => {
    const resource = new AsyncResource<Box>()

    resource.set({ value: 3 })
    expect(resource.state).toEqual({ status: 'success', value: 3 })

    resource.reset()
    expect(resource.state).toEqual({ status: 'idle' })
  })
})
