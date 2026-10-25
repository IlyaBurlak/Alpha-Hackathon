import { describe, expect, it } from 'vitest'

import { UnexpectedResponseError } from '@/shared/api'

import { mapApplication, mapApplications } from './application-mapper'
import {
  APPLICATION_WITH_EMPTY_OFFERS_DTO,
  APPLICATION_WITH_OFFERS_DTO,
  APPLICATION_WITHOUT_OFFERS_DTO,
  PRODUCT_OFFER_DTO,
  SCORED_APPLICATION_DTO,
  SELECTED_APPLICATION_DTO,
  SUBMITTED_APPLICATION_WITHOUT_PRODUCT_DTO,
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
    expect(application.goal).toBeNull()
    expect(application).toMatchObject({ submittedAt: null, signedAt: null, issuedAt: null })
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
      description: null,
      decisionTime: null,
      scoring: null,
    })
  })

  it('treats an empty `products` array as "nothing fits", not as unavailable services', () => {
    expect(mapApplication(APPLICATION_WITH_EMPTY_OFFERS_DTO).productChoice).toEqual({ kind: 'offers', items: [] })
  })

  it('treats a missing `products` as "not selected" (bank services are unavailable)', () => {
    expect(mapApplication(APPLICATION_WITHOUT_OFFERS_DTO).productChoice).toEqual({ kind: 'not-selected' })
  })

  it('maps the selected product from `product`', () => {
    expect(mapApplication(SELECTED_APPLICATION_DTO).productChoice).toEqual({
      kind: 'selected',
      product: {
        name: 'Кредит для бизнеса с залогом',
        interestRate: 10,
        payments: 'ежемесячно, равными долями, с первым платежом через 6 месяцев',
      },
    })
  })

  it('does not offer products again once the application was sent', () => {
    expect(mapApplication(SUBMITTED_APPLICATION_WITHOUT_PRODUCT_DTO).productChoice).toEqual({ kind: 'not-selected' })
  })

  it('prefers the selected product over offers', () => {
    const dto = { ...SELECTED_APPLICATION_DTO, products: [PRODUCT_OFFER_DTO] }
    expect(mapApplication(dto).productChoice.kind).toBe('selected')
  })
})

describe('mapApplication: scoring and review stage', () => {
  it('has none when the backend does not send them', () => {
    expect(mapApplication(APPLICATION_WITHOUT_OFFERS_DTO)).toMatchObject({ scoring: null, reviewStage: null })
  })

  it('maps the application scoring, review stage and offer scoring', () => {
    const application = mapApplication(SCORED_APPLICATION_DTO)

    expect(application.reviewStage).toBe(1)
    expect(application.scoring).toEqual({
      score: 72,
      factors: [
        { title: 'Возраст бизнеса', description: '6 лет на рынке', points: 15, advice: null },
        { title: 'Кредитная история', description: 'Есть просрочка до 30 дней', points: -10, advice: 'Закройте просрочку' },
      ],
    })
  })

  it('maps the scoring of an offer of a draft', () => {
    const { productChoice } = mapApplication({ ...SCORED_APPLICATION_DTO, status: 'DRAFT' })

    expect(productChoice.kind === 'offers' && productChoice.items[0].scoring?.score).toBe(72)
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
    ['selected product without details', { ...SELECTED_APPLICATION_DTO, product: {} }],
    ['scoring without factors', { ...APPLICATION_WITHOUT_OFFERS_DTO, scoring: { score: 50 } }],
    ['unknown review stage', { ...APPLICATION_WITHOUT_OFFERS_DTO, reviewStage: 7 }],
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
  describe('other conditions offered by an employee', () => {
    const OFFER = {
      name: 'Особое предложение',
      persentage: 10,
      sum: 500_000,
      payments: 'ежемесячно',
      creditTime: { units: 'MONTH', value: 6 },
    }
    const offerDto = (status: string) => ({ ...SELECTED_APPLICATION_DTO, status, product: OFFER, solutionComment: 'Меньше сумма' })

    it('keeps the requested conditions while the offer waits for an answer', () => {
      expect(mapApplication(offerDto('SPECIALPRODUCTOFFERED'))).toMatchObject({
        status: 'SPECIALPRODUCTOFFERED',
        sum: 1_000_000,
        operatorComment: 'Меньше сумма',
        specialOffer: { sum: 500_000, interestRate: 10, creditTime: { unit: 'MONTH', value: 6 } },
      })
    })

    it('replaces the requested conditions with the accepted ones', () => {
      expect(mapApplication(offerDto('SPECIALPRODUCTACCEPTED'))).toMatchObject({
        sum: 500_000,
        creditTime: { unit: 'MONTH', value: 6 },
      })
    })

    it('rejects an offer without a sum', () => {
      expect(() => mapApplication({ ...offerDto('SPECIALPRODUCTOFFERED'), product: { ...OFFER, sum: undefined } })).toThrow()
    })
  })
})
