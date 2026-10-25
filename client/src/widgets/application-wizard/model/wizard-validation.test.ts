import { describe, expect, it } from 'vitest'

import { createInitialForm } from './wizard-form'
import type { WizardForm } from './wizard-form'
import { validateWizardForm } from './wizard-validation'

function createValidForm(): WizardForm {
  return {
    ...createInitialForm(),
    phone: '+7 916 482-17-35',
    email: 'a@kolos-bakery.ru',
    revenue: '48 600 000',
    employees: '34',
    otherLoans: 'no',
  }
}

describe('validateWizardForm', () => {
  it('accepts a filled form without collateral', () => {
    expect(validateWizardForm(createValidForm(), false)).toEqual([])
  })

  it('reports every missing field in screen order, with short hints', () => {
    const issues = validateWizardForm(createInitialForm(), true)

    expect(issues.map(({ field }) => field)).toEqual([
      'phone',
      'email',
      'revenue',
      'otherLoans',
      'collateralType',
      'collateralValue',
    ])
    expect(issues[0].message).toBe('Введите номер полностью, например +7 916 482-17-35')
  })

  it.each([
    ['short phone', { phone: '+7 916 482' }, 'phone'],
    ['email without domain', { email: 'a@b' }, 'email'],
    ['email with a one-letter zone', { email: 'a@b.c' }, 'email'],
    ['zero revenue', { revenue: '0' }, 'revenue'],
  ])('rejects %s', (_case, patch, field) => {
    expect(validateWizardForm({ ...createValidForm(), ...patch }, false).map((issue) => issue.field)).toEqual([field])
  })

  it('asks for payments only when the user has other loans', () => {
    expect(validateWizardForm({ ...createValidForm(), otherLoans: 'yes' }, false)).toEqual([
      { field: 'otherLoanPayments', message: 'Укажите сумму платежей в месяц' },
    ])
    expect(validateWizardForm({ ...createValidForm(), otherLoans: 'yes', otherLoanPayments: '50 000' }, false)).toEqual([])
  })

  it('asks for collateral only for a secured variant', () => {
    expect(validateWizardForm(createValidForm(), false)).toEqual([])
    expect(validateWizardForm(createValidForm(), true).map(({ field }) => field)).toEqual(['collateralType', 'collateralValue'])
  })
})
