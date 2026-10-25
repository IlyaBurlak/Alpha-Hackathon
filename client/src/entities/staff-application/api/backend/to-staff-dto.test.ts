import { describe, expect, it } from 'vitest'

import { mapStaffApplication } from '../staff-application-mapper'
import { toStaffApplicationDto } from './to-staff-dto'

const NOW = new Date('2026-10-26T12:00:00Z').getTime()

/** Copied from GET /applications/:id/score of a running server (server/README.md). */
const SCORED_APPLICATION = {
  id: 1,
  userId: 2,
  organizationId: 2,
  sum: 3_000_000,
  status: 'SUBMITTED',
  createdAt: '2026-10-25T10:07:41.016Z',
  solutionComment: null,
  operatorId: null,
  creditTime: { units: 'MONTH', value: 24 },
  applicationScore: {
    id: 1,
    applicationId: 1,
    scoringDate: null,
    score: null,
    status: 'WAITONGOPERATOR',
    history: {
      creditHistory: [{ provisionDate: '2022-05-10', sum: 50_000, status: 'PAID', paymentDeadline: '2023-05-10' }],
      bankrupt: false,
      casesDelayedPayment: 0,
    },
    registerInfo: {
      isActive: true,
      registrationDate: '2021-01-15',
      authCapital: 20_000,
      employeesCount: 24,
      annualIncome: 400_000,
      annualExpenses: 200_000,
      lastYearBalances: [
        100_000, 100_040, 100_023, 140_022, 200_342, 123_333, 4_632_222, 200_001, 322_221, 104_000, 100_500, 100_000, 100_023,
        140_022, 200_342, 123_333,
      ],
      ogrn: '1234567890124',
      okved: '58.19 Виды издательской деятельности прочие',
      head: 'Василенко Анжелика',
      kpp: '500101001',
      bankClientSince: '2023-01-15',
      address: 'г. Санкт-Петербург, ул. Ленина, д. 2',
      account: '4015****23',
      type: 'ООО',
    },
    mlScore: {},
  },
  productId: 4,
  product: {
    name: 'Кредит для бизнеса с господдержкой',
    persentage: 5,
    payments: 'ежемесячно, равными долями, с первым платежом через 6 месяцев',
  },
  loanIssuanceDate: '2026-10-25T10:07:41.016Z',
}

const OPERATOR = { login: 'alfaOperator1', fullName: 'Кошмариков Антон', id: 1 }

function convert(overrides: Record<string, unknown>) {
  return toStaffApplicationDto({ ...SCORED_APPLICATION, ...overrides }, NOW)
}

describe('toStaffApplicationDto', () => {
  it('produces an application the staff mapper accepts, with the register data of the backend', () => {
    const application = mapStaffApplication(convert({}))

    expect(application).toMatchObject({
      id: '1',
      status: 'ready',
      assigneeId: null,
      amount: 3_000_000,
      termInMonths: 24,
      product: { name: 'Кредит для бизнеса с господдержкой', isSecured: false },
      company: { ogrn: '1234567890124', kpp: '500101001', head: 'Василенко Анжелика', employeesCount: 24, annualRevenue: 400_000 },
    })
    expect(application.scoring).not.toBeNull()
  })

  it('shows the last twelve account balances as the turnover', () => {
    const { turnover } = mapStaffApplication(convert({}))
    expect(turnover.map(({ amount }) => amount)).toEqual(
      SCORED_APPLICATION.applicationScore.registerInfo.lastYearBalances.slice(-12),
    )
  })

  it('keeps placeholders when the register and the credit bureau did not answer', () => {
    const application = mapStaffApplication(
      convert({ applicationScore: { ...SCORED_APPLICATION.applicationScore, registerInfo: {}, history: undefined } }),
    )
    expect(application.company).toMatchObject({ ogrn: '—', head: '—', employeesCount: 0 })
  })

  it('treats a sent application without a scoring record, or with a scoring in progress, as being scored', () => {
    expect(convert({ applicationScore: undefined })).toMatchObject({ status: 'scoring', scoring: null })
    expect(convert({ applicationScore: { status: 'PENDINGREGISTER' } })).toMatchObject({ status: 'scoring' })
  })

  it('takes the register and bankruptcy checks from the backend', () => {
    const inactive = mapStaffApplication(
      convert({ applicationScore: { ...SCORED_APPLICATION.applicationScore, registerInfo: { ...SCORED_APPLICATION.applicationScore.registerInfo, isActive: false } } }),
    )
    expect(inactive.checks.find(({ title }) => title === 'ЕГРЮЛ')?.level).toBe('fail')

    const bankrupt = mapStaffApplication(
      convert({ applicationScore: { ...SCORED_APPLICATION.applicationScore, history: { creditHistory: [], bankrupt: true, casesDelayedPayment: 0 } } }),
    )
    expect(bankrupt.checks.find(({ title }) => title === 'Бюро кредитных историй')?.level).toBe('fail')
    expect(mapStaffApplication(convert({})).checks.find(({ title }) => title === 'ЕГРЮЛ')?.level).toBe('ok')
  })

  it('has no KPP for a sole proprietor', () => {
    const sole = { ...SCORED_APPLICATION.applicationScore.registerInfo, type: 'ИП' }
    const application = mapStaffApplication(convert({ applicationScore: { ...SCORED_APPLICATION.applicationScore, registerInfo: sole } }))
    expect(application.company.kpp).toBeNull()
  })

  it('keeps every figure finite when the register reports no revenue', () => {
    const empty = { ...SCORED_APPLICATION.applicationScore.registerInfo, annualIncome: 0, employeesCount: 0, lastYearBalances: Array(16).fill(0) }
    const application = mapStaffApplication(convert({ applicationScore: { ...SCORED_APPLICATION.applicationScore, registerInfo: empty } }))

    expect(application.company.annualRevenue).toBe(0)
    expect(application.scoring && Number.isFinite(application.scoring.score)).toBe(true)
    expect(application.turnover).toHaveLength(12)
    expect(application.loans.every(({ balance, monthlyPayment }) => Number.isFinite(balance) && Number.isFinite(monthlyPayment))).toBe(true)
  })

  it('hides drafts', () => {
    expect(convert({ status: 'DRAFT' })).toBeNull()
  })

  it('turns the operator into the assignee of the directory', () => {
    expect(convert({ operatorId: 1, operator: OPERATOR })).toMatchObject({ assigneeId: 'op1' })
  })

  it('reads the reason of a refusal from the start of the comment', () => {
    const application = mapStaffApplication(
      convert({ status: 'REJECTED', operator: OPERATOR, solutionComment: 'Высокая долговая нагрузка. Платёж выше нормы.' }),
    )
    expect(application).toMatchObject({
      status: 'rejected',
      decision: { type: 'reject', reason: 'Высокая долговая нагрузка', comment: 'Платёж выше нормы.', byEmployeeId: 'op1' },
    })
  })

  it('maps the offer of other conditions and the answers of the client', () => {
    const offer = {
      name: 'Особое предложение',
      persentage: 10,
      sum: 1_500_000,
      payments: 'ежемесячно',
      creditTime: { units: 'MONTH', value: 12 },
    }
    const offered = mapStaffApplication(convert({ status: 'SPECIALPRODUCTOFFERED', operator: OPERATOR, product: offer }))
    expect(offered).toMatchObject({
      status: 'offer',
      decision: { type: 'offer', amount: 1_500_000, termInMonths: 12, rate: 10 },
    })
    expect(mapStaffApplication(convert({ status: 'SPECIALPRODUCTACCEPTED', operator: OPERATOR, product: offer })).status).toBe('approved')
    expect(mapStaffApplication(convert({ status: 'SPECIALPRODUCTREJECTED', operator: OPERATOR, product: offer })).status).toBe('rejected')
  })
})
