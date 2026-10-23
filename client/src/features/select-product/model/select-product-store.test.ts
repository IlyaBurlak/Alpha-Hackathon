import { beforeEach, describe, expect, it, vi } from 'vitest'

import { selectApplicationProduct } from '@/entities/application'
import { ApiError } from '@/shared/api'

import { SelectProductStore } from './select-product-store'

// The factory does not load the real entity: its barrel pulls in Alfa UI components that cannot run in Node.
vi.mock('@/entities/application', () => ({ selectApplicationProduct: vi.fn() }))

const UPDATED = { id: 2, status: 'SUBMITTED' } as Awaited<ReturnType<typeof selectApplicationProduct>>

beforeEach(() => {
  vi.mocked(selectApplicationProduct).mockReset()
})

describe('SelectProductStore', () => {
  it('sends the choice and returns the updated application', async () => {
    vi.mocked(selectApplicationProduct).mockResolvedValue(UPDATED)
    const store = new SelectProductStore()

    const result = await store.select(2, 4)

    expect(selectApplicationProduct).toHaveBeenCalledWith(2, 4)
    expect(result).toBe(UPDATED)
    expect(store.isSubmitting).toBe(false)
    expect(store.errorMessage).toBeNull()
  })

  it('marks the offer being submitted while the request is in flight', async () => {
    let resolveRequest: (value: typeof UPDATED) => void = () => {}
    vi.mocked(selectApplicationProduct).mockReturnValue(new Promise((resolve) => (resolveRequest = resolve)))
    const store = new SelectProductStore()

    const pending = store.select(2, 4)
    expect(store.pendingProductId).toBe(4)
    expect(store.isSubmitting).toBe(true)

    resolveRequest(UPDATED)
    await pending
    expect(store.pendingProductId).toBeNull()
  })

  it('ignores a second selection while one is in flight', async () => {
    vi.mocked(selectApplicationProduct).mockReturnValue(new Promise(() => {}))
    const store = new SelectProductStore()
    void store.select(2, 4)

    expect(await store.select(2, 1)).toBeNull()
    expect(selectApplicationProduct).toHaveBeenCalledOnce()
  })

  it.each([
    'Выбранный продукт недоступен для данной заявки',
    'Сервисы банка недоступны. Попробуйте позже',
    'Продукт уже выбран для данной заявки',
  ])('shows the backend error: %s', async (message) => {
    vi.mocked(selectApplicationProduct).mockRejectedValue(new ApiError(500, message))
    const store = new SelectProductStore()

    expect(await store.select(2, 4)).toBeNull()
    expect(store.errorMessage).toBe(message)
    expect(store.isSubmitting).toBe(false)
  })

  it('clears the error on a retry', async () => {
    vi.mocked(selectApplicationProduct).mockRejectedValueOnce(new ApiError(500, 'fail')).mockResolvedValueOnce(UPDATED)
    const store = new SelectProductStore()

    await store.select(2, 4)
    await store.select(2, 4)

    expect(store.errorMessage).toBeNull()
  })
})
