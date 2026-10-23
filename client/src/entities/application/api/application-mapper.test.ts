import { describe, expect, it } from 'vitest'

import { UnexpectedResponseError } from '@/shared/api'

import { mapApplication, mapApplications } from './application-mapper'
import {
  APPLICATION_WITH_EMPTY_OFFERS_DTO,
  APPLICATION_WITH_OFFERS_DTO,
  APPLICATION_WITHOUT_OFFERS_DTO,
  PRODUCT_OFFER_DTO,
  SELECTED_APPLICATION_DTO,
} from './application-dtos.fixture'

describe('mapApplication: base fields', () => {
  it('maps ids, sum, status, credit time and dates', () => {
    const application = mapApplication(APPLICATION_WITHOUT_OFFERS_DTO)

    expect(application).toMatchObject({
      id: 2,
      organizationId: 1,
      sum: 1_000_000,
      status: 'DRAFT',
      creditTime: { unit: 'YEAR', value: 1 },
    })
    expect(application.createdAt).toEqual(new Date('2026-10-23T18:22:52.183Z'))
    expect(application.loanIssuanceDate).toEqual(new Date('2026-10-23T18:22:52.183Z'))
  })

  it.each(['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'])('accepts status %s', (status) => {
    expect(mapApplication({ ...APPLICATION_WITHOUT_OFFERS_DTO, status }).status).toBe(status)
  })

  it.each(['DAY', 'MONTH', 'YEAR'])('accepts credit time unit %s', (units) => {
    const dto = { ...APPLICATION_WITHOUT_OFFERS_DTO, creditTime: { units, value: 3 } }
    expect(mapApplication(dto).creditTime).toEqual({ unit: units, value: 3 })
  })
})

describe('mapApplication: product choice', () => {
  it('maps offered products and renames `persentage` to `interestRate`', () => {
    const { productChoice } = mapApplication(APPLICATION_WITH_OFFERS_DTO)

    expect(productChoice.kind).toBe('offers')
    if (productChoice.kind !== 'offers') return
    expect(productChoice.items).toHaveLength(2)
    expect(productChoice.items[0]).toEqual({
      id: 1,
      name: 'Кредит для бизнеса с залогом',
      sum: 1_000_000,
      creditTime: { unit: 'YEAR', value: 1 },
      collateral: 120_000,
      interestRate: 10,
      payments: 'ежемесячно, равными долями, с первым платежом через 6 месяцев',
    })
  })

  it('treats an empty `products` array as "nothing fits", not as unavailable services', () => {
    expect(mapApplication(APPLICATION_WITH_EMPTY_OFFERS_DTO).productChoice).toEqual({ kind: 'offers', items: [] })
  })

  it('treats a missing `products` as "not selected" (bank services are unavailable)', () => {
    expect(mapApplication(APPLICATION_WITHOUT_OFFERS_DTO).productChoice).toEqual({ kind: 'not-selected' })
  })

  it('maps the selected product when `productId` is set', () => {
    expect(mapApplication(SELECTED_APPLICATION_DTO).productChoice).toEqual({
      kind: 'selected',
      product: {
        name: 'Кредит для бизнеса с залогом',
        interestRate: 10,
        payments: 'ежемесячно, равными долями, с первым платежом через 6 месяцев',
      },
    })
  })

  it('prefers the selected product over offers', () => {
    const dto = { ...SELECTED_APPLICATION_DTO, products: [PRODUCT_OFFER_DTO] }
    expect(mapApplication(dto).productChoice.kind).toBe('selected')
  })
})

describe('mapApplication: invalid responses', () => {
  it.each([
    ['not an object', null],
    ['no id', { ...APPLICATION_WITHOUT_OFFERS_DTO, id: undefined }],
    ['sum is a string', { ...APPLICATION_WITHOUT_OFFERS_DTO, sum: '1000000' }],
    ['unknown status', { ...APPLICATION_WITHOUT_OFFERS_DTO, status: 'IN_SCORING' }],
    ['numeric status', { ...APPLICATION_WITHOUT_OFFERS_DTO, status: 1 }],
    ['unknown credit time unit', { ...APPLICATION_WITHOUT_OFFERS_DTO, creditTime: { units: 'WEEK', value: 1 } }],
    ['numeric credit time unit', { ...APPLICATION_WITHOUT_OFFERS_DTO, creditTime: { units: 3, value: 1 } }],
    ['broken date', { ...APPLICATION_WITHOUT_OFFERS_DTO, createdAt: 'yesterday' }],
    ['selected product without details', { ...SELECTED_APPLICATION_DTO, product: undefined }],
    ['offer without id', { ...APPLICATION_WITH_OFFERS_DTO, products: [{ ...PRODUCT_OFFER_DTO, id: undefined }] }],
    ['offer with renamed rate field', { ...APPLICATION_WITH_OFFERS_DTO, products: [{ ...PRODUCT_OFFER_DTO, persentage: undefined }] }],
  ])('throws UnexpectedResponseError when %s', (_case, dto) => {
    expect(() => mapApplication(dto)).toThrow(UnexpectedResponseError)
  })
})

describe('mapApplications', () => {
  it('maps a list with mixed selected and not selected applications', () => {
    const applications = mapApplications([APPLICATION_WITHOUT_OFFERS_DTO, SELECTED_APPLICATION_DTO])

    expect(applications.map((application) => application.productChoice.kind)).toEqual(['not-selected', 'selected'])
  })

  it('maps an empty list', () => {
    expect(mapApplications([])).toEqual([])
  })

  it('throws when the response is not an array', () => {
    expect(() => mapApplications({ error: 'oops' })).toThrow(UnexpectedResponseError)
  })
})
