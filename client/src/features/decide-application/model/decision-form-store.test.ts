import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  StaffApplicationDetailStore,
  StaffApplicationListStore,
  decideStaffApplication,
  getStaffCapabilities,
} from '@/entities/staff-application'
import type { Recommendation, StaffApplication } from '@/entities/staff-application'
import { ApiError } from '@/shared/api'

import { DecisionFormStore } from './decision-form-store'

vi.mock('@/entities/staff-application', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/entities/staff-application')>()),
  decideStaffApplication: vi.fn(),
  getStaffCapabilities: vi.fn(() => ({ canRequestData: true, canReopenDecision: true, canAssignOthers: true })),
}))

const ACTOR = { id: 'u1', name: 'Мария Иванова' }

function createApplication(recommendation: Recommendation): StaffApplication {
  return { id: 'a1', amount: 3_000_000, termInMonths: 24, scoring: { rate: 18.9 }, recommendation } as StaffApplication
}

const APPROVE = createApplication({ type: 'approve', reasons: [], offer: null })

function createStore(application = APPROVE) {
  const list = new StaffApplicationListStore()
  const detail = new StaffApplicationDetailStore()
  return { store: new DecisionFormStore(application, list, detail), list, detail }
}

beforeEach(() => {
  vi.mocked(decideStaffApplication).mockReset()
  vi.mocked(getStaffCapabilities).mockReturnValue({ canRequestData: true, canReopenDecision: true, canAssignOthers: true })
})

describe('DecisionFormStore: what the backend cannot do', () => {
  it('offers all four answers to an employee of the mock database', () => {
    expect(createStore().store.availableTypes).toEqual(['approve', 'offer', 'clarify', 'reject'])
  })

  it('hides "request data" for a backend operator and turns that advice into other terms', () => {
    vi.mocked(getStaffCapabilities).mockReturnValue({ canRequestData: false, canReopenDecision: false, canAssignOthers: false })
    const { store } = createStore(createApplication({ type: 'clarify', reasons: [], offer: null }))

    expect(store.availableTypes).not.toContain('clarify')
    expect(store.type).toBe('offer')
  })
})

describe('DecisionFormStore: defaults', () => {
  it('follows the recommendation until another option is chosen', () => {
    const { store } = createStore(createApplication({ type: 'reject', reasons: [], offer: null }))

    expect(store.type).toBe('reject')

    store.choose('approve')

    expect(store.type).toBe('approve')
  })

  it('suggests three quarters of the sum and a rate a point above the model when there is no counter offer', () => {
    const { store } = createStore()

    expect(store.amount).toBe(2_300_000)
    expect(store.rate).toBe(19.9)
    expect(store.termInMonths).toBe(24)
  })

  it('takes the counter offer of the recommendation', () => {
    const { store } = createStore(createApplication({ type: 'offer', reasons: [], offer: { amount: 1_500_000, termInMonths: 36 } }))

    expect(store.amount).toBe(1_500_000)
    expect(store.termInMonths).toBe(36)
  })

  it('ticks two documents when the recommendation is to ask for data', () => {
    const { store } = createStore(createApplication({ type: 'clarify', reasons: [], offer: null }))

    expect(store.documents).toEqual(['Бухгалтерская отчётность за последний год', 'Пояснение по арбитражным делам'])
  })
})

describe('DecisionFormStore: input', () => {
  it('groups the digits of the amount and keeps the rate to digits and a separator', () => {
    const { store } = createStore()

    store.setAmount('1a500b000')
    store.setRate('17,5%x')

    expect(store.amount).toBe(1_500_000)
    expect(store.rateText).toBe('17,5')
    expect(store.rate).toBe(17.5)
  })

  it('calculates the payment of the counter offer when the sum and the rate are filled', () => {
    const { store } = createStore()
    store.setAmount('100000')
    store.setRate('12')
    store.setTerm(12)

    expect(store.offerPayment).toBeCloseTo(8884.88, 2)

    store.setRate('')

    expect(store.offerPayment).toBeNull()
  })

  it('limits the comment', () => {
    const { store } = createStore()

    store.setComment('x'.repeat(500))

    expect(store.comment).toHaveLength(400)
  })
})

describe('DecisionFormStore: confirmation', () => {
  it('asks to confirm an approval without any comment', () => {
    const { store } = createStore()

    store.requestConfirmation()

    expect(store.isConfirming).toBe(true)
    expect(store.errorMessage).toBeNull()
  })

  it.each([
    ['clarify', { comment: 'коротко', documents: ['Доверенность заявителя'] }, 'comment', 'Напишите клиенту комментарий, хотя бы пару слов'],
    ['reject', { comment: 'Достаточно длинный комментарий', reason: '' }, 'reason', 'Выберите причину отказа'],
    ['clarify', { comment: 'Достаточно длинный комментарий', documents: [] }, 'documents', 'Отметьте, какие данные нужны'],
    ['offer', { amount: '50000' }, 'offer', 'Проверьте сумму и ставку'],
  ] as const)('does not confirm a %s with a problem in %s', (type, patch, field, message) => {
    const { store } = createStore()
    store.choose(type)
    if ('comment' in patch) store.setComment(patch.comment)
    if ('reason' in patch) store.setReason(patch.reason)
    if ('documents' in patch) store.documents = [...patch.documents]
    if ('amount' in patch) store.setAmount(patch.amount)

    store.requestConfirmation()

    expect(store.isConfirming).toBe(false)
    expect(store.invalidField).toBe(field)
    expect(store.errorMessage).toBe(message)
  })

  it('clears the problem when another option is chosen', () => {
    const { store } = createStore()
    store.choose('reject')
    store.requestConfirmation()

    store.choose('approve')

    expect(store.errorMessage).toBeNull()
    expect(store.invalidField).toBeNull()
  })

  it('sends the decision of the chosen option and shows the fresh application', async () => {
    const updated = { id: 'a1', status: 'rejected' } as StaffApplication
    vi.mocked(decideStaffApplication).mockResolvedValue(updated)
    const { store, list, detail } = createStore()
    const replaceList = vi.spyOn(list, 'replace')
    const replaceDetail = vi.spyOn(detail, 'replace')
    store.choose('reject')
    store.setReason('Недостаточная выручка')
    store.setComment('  Выручка мала для суммы  ')
    store.requestConfirmation()

    expect(await store.confirm(ACTOR)).toBe(updated)

    expect(decideStaffApplication).toHaveBeenCalledWith(
      'a1',
      { type: 'reject', comment: 'Выручка мала для суммы', reason: 'Недостаточная выручка' },
      ACTOR,
    )
    expect(replaceList).toHaveBeenCalledWith(updated)
    expect(replaceDetail).toHaveBeenCalledWith(updated)
    expect(store.isConfirming).toBe(false)
  })

  it('sends a counter offer with its terms', async () => {
    vi.mocked(decideStaffApplication).mockResolvedValue({ id: 'a1' } as StaffApplication)
    const { store } = createStore()
    store.choose('offer')
    store.setAmount('2000000')
    store.setTerm(18)
    store.setRate('17,5')

    await store.confirm(ACTOR)

    expect(decideStaffApplication).toHaveBeenCalledWith('a1', { type: 'offer', comment: '', amount: 2_000_000, termInMonths: 18, rate: 17.5 }, ACTOR)
  })

  it('shows the error of the backend and closes the confirmation', async () => {
    vi.mocked(decideStaffApplication).mockRejectedValue(new ApiError(500, 'Заявка не найдена'))
    const { store } = createStore()
    store.requestConfirmation()

    expect(await store.confirm(ACTOR)).toBeNull()

    expect(store.errorMessage).toBe('Заявка не найдена')
    expect(store.isConfirming).toBe(false)
    expect(store.isSaving).toBe(false)
  })
})
