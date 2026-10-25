import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createApplication } from '@/entities/application'
import { ApiError } from '@/shared/api'

import { CreateApplicationFormStore } from './create-application-form-store'

vi.mock('@/entities/application', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/entities/application')>()),
  createApplication: vi.fn(),
}))

const CREATED = { id: 5 } as Awaited<ReturnType<typeof createApplication>>

beforeEach(() => {
  vi.mocked(createApplication).mockReset()
})

describe('CreateApplicationFormStore: input', () => {
  it('starts with 100 thousand for 24 months and no goal', () => {
    const store = new CreateApplicationFormStore(1)

    expect(store.sum).toBe(100_000)
    expect(store.termInMonths).toBe(24)
    expect(store.goal).toBeNull()
  })

  it('keeps only digits in the sum and groups them', () => {
    const store = new CreateApplicationFormStore(1)

    store.setSum('2a500b000')

    expect(store.sum).toBe(2_500_000)
    expect(store.sumText).toMatch(/^2\s500\s000$/)
  })

  it('allows clearing the sum', () => {
    const store = new CreateApplicationFormStore(1)

    store.setSum('')

    expect(store.sumText).toBe('')
    expect(store.sum).toBe(0)
  })

  it('ignores an unknown goal', () => {
    const store = new CreateApplicationFormStore(1)

    store.setGoal('flying')

    expect(store.goal).toBeNull()
  })
})

describe('CreateApplicationFormStore: validation', () => {
  it('asks to choose a goal and does not call the backend', async () => {
    const store = new CreateApplicationFormStore(1)

    expect(await store.submit()).toBeNull()
    expect(store.errorMessage).toBe('Выберите, для чего нужны деньги')
    expect(createApplication).not.toHaveBeenCalled()
  })

  it.each([
    ['below the minimum', '99999'],
    ['above the maximum', '50000001'],
    ['empty', ''],
  ])('rejects a sum %s', async (_case, sum) => {
    const store = new CreateApplicationFormStore(1)
    store.setGoal('equipment')
    store.setSum(sum)

    expect(await store.submit()).toBeNull()
    expect(store.errorMessage).toBe('Сумма от 100 тыс до 50 млн ₽')
    expect(createApplication).not.toHaveBeenCalled()
  })
})

describe('CreateApplicationFormStore: submit', () => {
  it('sends the sum, the term in months and the goal, and returns the application', async () => {
    vi.mocked(createApplication).mockResolvedValue(CREATED)
    const store = new CreateApplicationFormStore(3)
    store.setGoal('equipment')
    store.setSum('1500000')
    store.setTermInMonths(36)

    const result = await store.submit()

    expect(createApplication).toHaveBeenCalledWith({
      organizationId: 3,
      sum: 1_500_000,
      creditTime: { unit: 'MONTH', value: 36 },
      goal: 'equipment',
    })
    expect(result).toBe(CREATED)
    expect(store.isSubmitting).toBe(false)
    expect(store.errorMessage).toBeNull()
  })

  it('exposes the backend error and stays usable', async () => {
    vi.mocked(createApplication).mockRejectedValue(
      new ApiError(500, 'Не найдена связь текущего пользователя с организацией из заявки'),
    )
    const store = new CreateApplicationFormStore(1)
    store.setGoal('other')

    expect(await store.submit()).toBeNull()
    expect(store.errorMessage).toBe('Не найдена связь текущего пользователя с организацией из заявки')
    expect(store.isSubmitting).toBe(false)
  })

  it('clears the previous error on the next attempt', async () => {
    vi.mocked(createApplication).mockRejectedValueOnce(new ApiError(500, 'fail')).mockResolvedValueOnce(CREATED)
    const store = new CreateApplicationFormStore(1)
    store.setGoal('other')

    await store.submit()
    await store.submit()

    expect(store.errorMessage).toBeNull()
  })
})
