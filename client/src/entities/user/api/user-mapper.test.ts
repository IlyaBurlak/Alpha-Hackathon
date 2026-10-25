import { describe, expect, it } from 'vitest'

import { UnexpectedResponseError } from '@/shared/api'

import { mapUser } from './user-mapper'

const ORGANIZATION_DTO = { id: 2, inn: '5001234569', fullName: 'ООО "Кот не знает"', type: 'OO' }
const USER_DTO = { id: 2, login: 'alfaAngelika', fullName: 'Василенко Анжелика', organizations: [ORGANIZATION_DTO] }

describe('mapUser', () => {
  it('maps the fields the backend returns', () => {
    const user = mapUser(USER_DTO)

    expect(user).toMatchObject({ id: 2, login: 'alfaAngelika', fullName: 'Василенко Анжелика' })
    expect(user.organizations[0]).toMatchObject({ id: 2, inn: '5001234569', name: 'ООО "Кот не знает"', type: 'legal-entity' })
  })

  it('fills missing requisites, role, revenue and contacts with mocks', () => {
    const user = mapUser(USER_DTO)

    expect(user.organizations[0]).toMatchObject({ kpp: '500101001', role: 'Генеральный директор', annualRevenue: 32_000_000 })
    expect(user.email).toBe('alfaangelika@example.ru')
    expect(user.phone).toMatch(/^\+7/)
  })

  it('prefers what the backend returns over the mocks', () => {
    const user = mapUser({
      ...USER_DTO,
      phone: '+7 900 000-00-00',
      email: 'real@bank.ru',
      organizations: [{ ...ORGANIZATION_DTO, kpp: '111111111', role: 'Собственник', annualIncome: 5 }],
    })

    expect(user).toMatchObject({ phone: '+7 900 000-00-00', email: 'real@bank.ru' })
    expect(user.organizations[0]).toMatchObject({ kpp: '111111111', role: 'Собственник', annualRevenue: 5 })
  })

  it('has no KPP for a sole proprietor and a default role for an unknown company', () => {
    const user = mapUser({
      ...USER_DTO,
      organizations: [
        { id: 5, inn: '2301234560', fullName: 'ИП Сырный Иван', type: 'IndividualEntrepreneur' },
        { id: 9, inn: '0000000000', fullName: 'ИП Новый', type: 'IndividualEntrepreneur' },
      ],
    })

    expect(user.organizations[0].kpp).toBeNull()
    expect(user.organizations[1]).toMatchObject({ kpp: null, role: 'Собственник', annualRevenue: null })
  })

  it('throws on a broken response', () => {
    expect(() => mapUser({ ...USER_DTO, organizations: [{ id: 1 }] })).toThrow(UnexpectedResponseError)
  })
})
