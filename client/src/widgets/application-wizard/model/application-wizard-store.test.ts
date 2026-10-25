import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { selectApplicationProduct } from '@/entities/application'
import type { Application, ProductOffer } from '@/entities/application'
import { ApiError } from '@/shared/api'

import { ApplicationWizardStore } from './application-wizard-store'

vi.mock('@/entities/application', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/entities/application')>()),
  selectApplicationProduct: vi.fn(),
}))

class MemoryStorage {
  private readonly values = new Map<string, string>()

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }

  removeItem(key: string): void {
    this.values.delete(key)
  }
}

const APPLICATION = { id: 7 } as Application

function createOffer(overrides: Partial<ProductOffer>): ProductOffer {
  return {
    id: 1,
    name: 'Кредит',
    sum: 1_000_000,
    creditTime: { unit: 'MONTH', value: 12 },
    collateral: 0,
    interestRate: 15,
    payments: 'ежемесячно',
    description: null,
    decisionTime: null,
    scoring: null,
    ...overrides,
  }
}

const PLAIN = createOffer({ id: 2 })
const SECURED = createOffer({ id: 1, collateral: 100_000, interestRate: 10 })

function fillValidData(store: ApplicationWizardStore): void {
  store.setPhone('+7 916 482-17-35')
  store.setText('email', 'a@kolos-bakery.ru')
  store.setDigits('revenue', '48600000')
  store.setOtherLoans('no')
}

function giveAllConsents(store: ApplicationWizardStore): void {
  store.toggleAllConsents()
}

beforeEach(() => {
  vi.mocked(selectApplicationProduct).mockReset()
  Object.defineProperty(globalThis, 'sessionStorage', { value: new MemoryStorage(), configurable: true })
})

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'sessionStorage')
})

describe('ApplicationWizardStore: variants and steps', () => {
  it('starts at the variant step with nothing chosen', () => {
    const store = new ApplicationWizardStore(APPLICATION, [PLAIN, SECURED])

    expect(store.step).toBe(1)
    expect(store.selectedOffer).toBeNull()
    expect(store.variants.offers.map(({ id }) => id)).toEqual([2, 1])
  })

  it('moves to the data step after a variant is picked', () => {
    const store = new ApplicationWizardStore(APPLICATION, [PLAIN, SECURED])

    store.pickOffer(1)

    expect(store.step).toBe(2)
    expect(store.maxStep).toBe(2)
    expect(store.isSecured).toBe(true)
  })

  it('goes back and allows returning only to reached steps', () => {
    const store = new ApplicationWizardStore(APPLICATION, [PLAIN])
    store.pickOffer(2)

    store.goBack()

    expect(store.step).toBe(1)
    expect(store.canGoToStep(2)).toBe(true)
    expect(store.canGoToStep(3)).toBe(false)
    expect(store.canGoToStep(1)).toBe(false)
  })
})

describe('ApplicationWizardStore: data step', () => {
  it('does not leave the data step with an invalid form and then shows every problem', () => {
    const store = new ApplicationWizardStore(APPLICATION, [PLAIN])
    store.pickOffer(2)

    expect(store.getIssue('phone')).toBeUndefined()

    store.goNext()

    expect(store.step).toBe(2)
    expect(store.getIssue('phone')?.message).toBe('Введите номер полностью, например +7 916 482-17-35')
    expect(store.getIssue('otherLoans')).toBeDefined()
    expect(store.invalidAttemptCount).toBe(1)
  })

  it('shows the problem of a field only after the user has left it', () => {
    const store = new ApplicationWizardStore(APPLICATION, [PLAIN])
    store.setPhone('916')

    expect(store.getIssue('phone')).toBeUndefined()

    store.touchField('phone')

    expect(store.getIssue('phone')).toBeDefined()
    expect(store.getIssue('email')).toBeUndefined()
  })

  it('hides the hint as soon as the field is fixed', () => {
    const store = new ApplicationWizardStore(APPLICATION, [PLAIN])
    store.setPhone('916')
    store.touchField('phone')

    store.setPhone('9164821735')

    expect(store.getIssue('phone')).toBeUndefined()
  })

  it('formats the phone as it is typed and keeps the e-mail free of spaces', () => {
    const store = new ApplicationWizardStore(APPLICATION, [PLAIN])

    store.setPhone('89164821735')
    store.setText('email', ' a@b.ru ')

    expect(store.form.phone).toBe('+7 916 482-17-35')
    expect(store.form.email).toBe('a@b.ru')
  })

  it('moves to review when the form is valid', () => {
    const store = new ApplicationWizardStore(APPLICATION, [PLAIN])
    store.pickOffer(2)
    fillValidData(store)

    store.goNext()

    expect(store.step).toBe(3)
    expect(store.issues).toEqual([])
  })

  it('requires collateral data for a secured variant', () => {
    const store = new ApplicationWizardStore(APPLICATION, [SECURED])
    store.pickOffer(1)
    fillValidData(store)

    store.goNext()

    expect(store.getIssue('collateralType')).toBeDefined()

    store.setCollateralType('Недвижимость')
    store.setDigits('collateralValue', '5000000')
    store.goNext()

    expect(store.step).toBe(3)
  })

  it('groups digits and limits the note', () => {
    const store = new ApplicationWizardStore(APPLICATION, [PLAIN])

    store.setDigits('revenue', '1a2b3c4d5')
    store.setText('note', 'x'.repeat(300))

    expect(store.form.revenue).toMatch(/^12\s345$/)
    expect(store.form.note).toHaveLength(200)
  })
})

describe('ApplicationWizardStore: consents', () => {
  it('toggles all consents at once', () => {
    const store = new ApplicationWizardStore(APPLICATION, [PLAIN])

    store.toggleAllConsents()
    expect(store.areAllConsentsGiven).toBe(true)

    store.toggleAllConsents()
    expect(store.form.consents).toEqual({ personalData: false, creditBureau: false, fiscalData: false })
  })

  it('is not complete until every consent is given', () => {
    const store = new ApplicationWizardStore(APPLICATION, [PLAIN])

    store.setConsent('personalData', true)

    expect(store.areAllConsentsGiven).toBe(false)
  })
})

describe('ApplicationWizardStore: submit', () => {
  it('does nothing without a chosen variant or consents', async () => {
    const store = new ApplicationWizardStore(APPLICATION, [PLAIN])

    expect(await store.submit()).toBeNull()

    store.pickOffer(2)
    expect(await store.submit()).toBeNull()
    expect(selectApplicationProduct).not.toHaveBeenCalled()
  })

  it('sends the chosen offer and forgets the draft', async () => {
    const sent = { id: 7, status: 'SUBMITTED' } as Application
    vi.mocked(selectApplicationProduct).mockResolvedValue(sent)
    const store = new ApplicationWizardStore(APPLICATION, [PLAIN, SECURED])
    store.pickOffer(2)
    giveAllConsents(store)

    expect(await store.submit()).toBe(sent)

    expect(selectApplicationProduct).toHaveBeenCalledWith(7, PLAIN)
    expect(new ApplicationWizardStore(APPLICATION, [PLAIN, SECURED]).step).toBe(1)
  })

  it('shows the backend error and stays on the page', async () => {
    vi.mocked(selectApplicationProduct).mockRejectedValue(new ApiError(500, 'Сервисы банка недоступны. Попробуйте позже'))
    const store = new ApplicationWizardStore(APPLICATION, [PLAIN])
    store.pickOffer(2)
    giveAllConsents(store)

    expect(await store.submit()).toBeNull()
    expect(store.errorMessage).toBe('Сервисы банка недоступны. Попробуйте позже')
    expect(store.isSubmitting).toBe(false)
  })
})

describe('ApplicationWizardStore: draft', () => {
  it('restores the step, the variant and the form after a reload', () => {
    const first = new ApplicationWizardStore(APPLICATION, [PLAIN, SECURED])
    first.pickOffer(2)
    first.setPhone('+7 916 482-17-35')

    const second = new ApplicationWizardStore(APPLICATION, [PLAIN, SECURED])

    expect(second.step).toBe(2)
    expect(second.selectedOfferId).toBe(2)
    expect(second.form.phone).toBe('+7 916 482-17-35')
  })

  it('starts over when the saved variant is no longer offered', () => {
    const first = new ApplicationWizardStore(APPLICATION, [PLAIN, SECURED])
    first.pickOffer(1)

    const second = new ApplicationWizardStore(APPLICATION, [PLAIN])

    expect(second.step).toBe(1)
    expect(second.selectedOffer).toBeNull()
  })

  it('ignores a broken draft', () => {
    sessionStorage.setItem('application-wizard:7', '{"step":9}')

    expect(new ApplicationWizardStore(APPLICATION, [PLAIN]).step).toBe(1)
  })
})
