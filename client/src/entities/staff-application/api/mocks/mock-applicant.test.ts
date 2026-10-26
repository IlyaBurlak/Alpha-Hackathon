import { describe, expect, it } from 'vitest'

import { buildMockApplicant } from './mock-applicant'

const INPUT = {
  applicationId: 7,
  inn: '7714825631',
  head: 'Соколова Анна Сергеевна',
  isSoleProprietor: false,
  isSecured: false,
  amount: 3e6,
}

describe('buildMockApplicant', () => {
  it('fills every field and keeps the head of the register as the applicant', () => {
    const { goal, applicant, collateral } = buildMockApplicant(INPUT)
    expect(goal).not.toBe('')
    expect(applicant.name).toBe(INPUT.head)
    expect(applicant.phone).toMatch(/^\+7 9\d{2} \d{3}-\d{2}-\d{2}$/)
    expect(applicant.email).toMatch(/^[a-z]\.[a-z]+@/)
    expect(collateral).toBeNull()
  })

  it('is stable for one application', () => {
    expect(buildMockApplicant(INPUT)).toEqual(buildMockApplicant(INPUT))
  })

  it('invents a name without the register, gives a sole proprietor their title and a secured product a collateral', () => {
    const { applicant, collateral } = buildMockApplicant({
      ...INPUT,
      head: null,
      isSoleProprietor: true,
      isSecured: true,
    })
    expect(applicant.name).not.toBe('')
    expect(applicant.role).toBe('Индивидуальный предприниматель')
    expect(collateral).toMatchObject({ owner: 'Заявитель' })
    expect(collateral?.value).toBeGreaterThan(INPUT.amount)
  })
})
