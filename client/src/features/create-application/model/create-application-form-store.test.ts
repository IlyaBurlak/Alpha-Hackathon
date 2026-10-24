import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createApplication } from '@/entities/application'
import { ApiError } from '@/shared/api'

import { CreateApplicationFormStore } from './create-application-form-store'

// The factory does not load the real entity: its barrel pulls in Alfa UI components that cannot run in Node.
vi.mock('@/entities/application', () => ({
  CREDIT_TIME_UNITS: { day: 'DAY', month: 'MONTH', year: 'YEAR' },
  createApplication: vi.fn(),
}))

const CREATED = { id: 5 } as Awaited<ReturnType<typeof createApplication>>

function fillValidForm(store: CreateApplicationFormStore): void {
  store.setSum('1000000')
  store.setTermValue('2')
}

beforeEach(() => {
  vi.mocked(createApplication).mockReset()
})

describe('CreateApplicationFormStore: validation', () => {
  it('cannot submit an empty form', () => {
    expect(new CreateApplicationFormStore(1).canSubmit).toBe(false)
  })

  it('can submit when sum and term are valid', () => {
    const store = new CreateApplicationFormStore(1)
    fillValidForm(store)

    expect(store.canSubmit).toBe(true)
  })

  it.each([
    ['sum is zero', '0', '2'],
    ['sum is negative', '-5', '2'],
    ['sum is not a number', 'abc', '2'],
    ['term is zero', '1000', '0'],
    ['term is fractional', '1000', '1.5'],
    ['term is empty', '1000', ''],
  ])('cannot submit when %s', (_case, sum, termValue) => {
    const store = new CreateApplicationFormStore(1)
    store.setSum(sum)
    store.setTermValue(termValue)

    expect(store.canSubmit).toBe(false)
  })
})

describe('CreateApplicationFormStore: submit', () => {
  it('sends the entered values with a year term by default and returns the application', async () => {
    vi.mocked(createApplication).mockResolvedValue(CREATED)
    const store = new CreateApplicationFormStore(3)
    fillValidForm(store)

    const result = await store.submit()

    expect(createApplication).toHaveBeenCalledWith({
      organizationId: 3,
      sum: 1_000_000,
      creditTime: { unit: 'YEAR', value: 2 },
    })
    expect(result).toBe(CREATED)
    expect(store.isSubmitting).toBe(false)
    expect(store.errorMessage).toBeNull()
  })

  it('uses the chosen term unit', async () => {
    vi.mocked(createApplication).mockResolvedValue(CREATED)
    const store = new CreateApplicationFormStore(6)
    fillValidForm(store)
    store.setTermUnit('MONTH')

    await store.submit()

    expect(createApplication).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: 6, creditTime: { unit: 'MONTH', value: 2 } }),
    )
  })

  it('does not call the backend when the form is invalid', async () => {
    const store = new CreateApplicationFormStore(1)

    expect(await store.submit()).toBeNull()
    expect(createApplication).not.toHaveBeenCalled()
  })

  it('exposes the backend error and stays usable', async () => {
    vi.mocked(createApplication).mockRejectedValue(
      new ApiError(500, 'Не найдена связь текущего пользователя с организацией из заявки'),
    )
    const store = new CreateApplicationFormStore(1)
    fillValidForm(store)

    expect(await store.submit()).toBeNull()
    expect(store.errorMessage).toBe('Не найдена связь текущего пользователя с организацией из заявки')
    expect(store.isSubmitting).toBe(false)
    expect(store.canSubmit).toBe(true)
  })

  it('clears the previous error on the next attempt', async () => {
    vi.mocked(createApplication).mockRejectedValueOnce(new ApiError(500, 'fail')).mockResolvedValueOnce(CREATED)
    const store = new CreateApplicationFormStore(1)
    fillValidForm(store)

    await store.submit()
    await store.submit()

    expect(store.errorMessage).toBeNull()
  })
})
