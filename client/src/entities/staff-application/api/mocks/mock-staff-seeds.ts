/**
 * MOCK: the applications of the staff queue. The backend has no endpoint that lists applications of all
 * clients for employees (docs/backend-requirements.md, staff cabinet), so these are the synthetic ones of the design.
 */
const HOUR = 3_600_000

export interface MockProduct {
  id: string
  name: string
  shortName: string
  isSecured: boolean
}

export const MOCK_PRODUCTS: Record<string, MockProduct> = {
  any: { id: 'any', name: 'Кредит на любые бизнес-цели', shortName: 'Без залога', isSecured: false },
  gov: { id: 'gov', name: 'Льготный кредит с господдержкой', shortName: 'Господдержка', isSecured: false },
  line: { id: 'line', name: 'Кредит с залогом', shortName: 'С залогом', isSecured: true },
  auto: { id: 'auto', name: 'Автокредит для бизнеса', shortName: 'Автокредит', isSecured: true },
}

export interface SeedStatus {
  status: 'scoring' | 'ready' | 'clarify' | 'rejected' | 'approved'
  /** Employee of the directory; the seeds need the names for the history. */
  assigneeId: string | null
}

type SeedRow = [
  number: string,
  name: string,
  inn: string,
  okved: string,
  address: string,
  head: string,
  registered: string,
  employees: number,
  revenue: number,
  debt: number,
  overdue: number,
  stable: 0 | 1,
  arbitration: number,
  taxDebt: number,
  productId: string,
  goal: string,
  amount: number,
  term: number,
  status: SeedStatus['status'],
  assigneeId: string | null,
  hoursAgo: number,
  role: string,
]

const ROWS: SeedRow[] = [
  ['204901', 'ООО «Колос и Ко»', '7714825631', '10.71 Производство хлеба', 'Москва, ул. Новослободская, 23', 'Соколова Анна Сергеевна', '2019-03-14', 34, 48.6e6, 3.1e6, 0, 1, 0, 0, 'any', 'Покупка оборудования', 3e6, 24, 'ready', 'u1', 2.5, 'Генеральный директор'],
  ['204902', 'ООО «Лак и Линия»', '5036187402', '96.02 Салоны красоты', 'Подольск, ул. Кирова, 8', 'Соколова Анна Сергеевна', '2023-05-22', 6, 7.2e6, 0.45e6, 1, 0, 0, 0, 'any', 'Пополнение оборотных средств', 3e6, 24, 'ready', null, 1.2, 'Собственник'],
  ['204903', 'ООО «ТрансВектор»', '6658412093', '49.41 Грузовые перевозки', 'Екатеринбург, ул. Шефская, 106', 'Ерёмин Павел Олегович', '2012-08-03', 58, 126e6, 41e6, 0, 1, 0, 0, 'gov', 'Покупка оборудования', 20e6, 36, 'ready', 'u1', 5, 'Финансовый директор'],
  ['204904', 'ИП Гусев Артём Олегович', '772814563201', '45.20 Ремонт автомобилей', 'Москва, Варшавское ш., 118', 'Гусев Артём Олегович', '2017-02-10', 12, 18e6, 1.2e6, 0, 1, 0, 0, 'line', 'Открытие новой точки', 5e6, 36, 'ready', 'u2', 7, 'Индивидуальный предприниматель'],
  ['204905', 'ООО «СеверСтрой»', '2901234876', '41.20 Строительство зданий', 'Архангельск, пр. Троицкий, 52', 'Лапин Игорь Викторович', '2015-06-01', 140, 210e6, 60e6, 0, 1, 3, 0, 'line', 'Пополнение оборотных средств', 25e6, 24, 'ready', null, 9, 'Генеральный директор'],
  ['204906', 'ООО «Зелёный двор»', '5402123987', '01.13 Овощеводство', 'Новосибирская обл., с. Ярково', 'Белов Сергей Петрович', '2020-04-17', 22, 34e6, 4e6, 0, 1, 0, 0, 'auto', 'Покупка транспорта', 8e6, 48, 'ready', null, 14, 'Генеральный директор'],
  ['204907', 'ИП Ковалёва Елена Николаевна', '503212345678', '47.71 Розничная торговля одеждой', 'Химки, ул. Победы, 3', 'Ковалёва Елена Николаевна', '2021-09-01', 4, 9.5e6, 0.8e6, 0, 0, 0, 0, 'any', 'Закупка товара', 1.5e6, 12, 'clarify', 'u1', 30, 'Индивидуальный предприниматель'],
  ['204908', 'ООО «Вкусно рядом»', '7725341987', '56.10 Рестораны', 'Москва, ул. Бутырская, 46', 'Рябова Ольга Игоревна', '2022-11-02', 18, 22e6, 6e6, 2, 0, 1, 0, 'any', 'Открытие новой точки', 4e6, 24, 'rejected', 'u2', 40, 'Генеральный директор'],
  ['204909', 'ООО «Медлайн Плюс»', '7701987654', '86.21 Медицинская практика', 'Москва, Ленинский пр., 30', 'Ахмедов Рустам Каримович', '2016-01-20', 76, 95e6, 12e6, 0, 1, 0, 0, 'gov', 'Покупка оборудования', 15e6, 60, 'approved', 'u3', 50, 'Генеральный директор'],
  ['204910', 'ООО «ЭкоПак»', '6312098745', '22.22 Производство упаковки', 'Самара, Заводское ш., 11', 'Миронова Дарья Олеговна', '2018-07-30', 41, 54e6, 8e6, 0, 1, 0, 0, 'line', 'Покупка оборудования', 12e6, 36, 'scoring', null, 0.15, 'Генеральный директор'],
  ['204911', 'ООО «Арт-Мебель»', '3664012398', '31.09 Производство мебели', 'Воронеж, ул. Остужева, 7', 'Зуев Николай Андреевич', '2014-05-12', 27, 41e6, 14e6, 0, 1, 1, 0, 'auto', 'Покупка транспорта', 6e6, 36, 'scoring', null, 0.05, 'Собственник'],
  ['204912', 'ООО «Типография Литера»', '7804556123', '18.12 Полиграфия', 'Санкт-Петербург, ул. Седова, 13', 'Карпов Илья Сергеевич', '2010-10-05', 49, 62e6, 9e6, 0, 1, 0, 0, 'any', 'Пополнение оборотных средств', 6e6, 24, 'ready', 'u1', 20, 'Генеральный директор'],
]

export interface SeedRecord {
  id: string
  number: string
  receivedAt: number
  status: SeedStatus['status'] | 'offer'
  assigneeId: string | null
  productId: string
  goal: string
  amount: number
  termInMonths: number
  company: {
    name: string
    inn: string
    kpp: string | null
    ogrn: string
    okved: string
    address: string
    head: string
    registeredAt: string
    employeesCount: number
    annualRevenue: number
    debt: number
    overdueCount: number
    hasStableTurnover: boolean
    arbitrationCases: number
    taxDebt: number
    clientSince: number
    account: string
  }
  applicant: { name: string; role: string; phone: string; email: string }
  collateral: { type: string; value: number; owner: string } | null
  /** Moment the model finishes calculating, for applications that are still being scored. */
  scoringReadyAt: number | null
}

const LEGAL_ENTITY_INN_LENGTH = 10

function toRecord([number, name, inn, okved, address, head, registered, employees, revenue, debt, overdue, stable, arbitration, taxDebt, productId, goal, amount, term, status, assigneeId, hoursAgo, role]: SeedRow, now: number): SeedRecord {
  const isLegalEntity = inn.length === LEGAL_ENTITY_INN_LENGTH
  const isAuto = productId === 'auto'
  return {
    id: `a${number}`,
    number,
    receivedAt: now - hoursAgo * HOUR,
    status,
    assigneeId,
    productId,
    goal,
    amount,
    termInMonths: term,
    company: {
      name,
      inn,
      kpp: isLegalEntity ? `${inn.slice(0, 4)}01001` : null,
      ogrn: `${isLegalEntity ? '1' : '3'}${inn.slice(0, 2)}7746${inn.slice(-6)}`,
      okved,
      address,
      head,
      registeredAt: registered,
      employeesCount: employees,
      annualRevenue: revenue,
      debt,
      overdueCount: overdue,
      hasStableTurnover: stable === 1,
      arbitrationCases: arbitration,
      taxDebt,
      clientSince: Number(registered.slice(0, 4)) + 1,
      account: `40702 •• ${inn.slice(-4)}`,
    },
    applicant: {
      name: head.split(' ').slice(0, 2).reverse().join(' '),
      role,
      phone: `+7 9${inn.slice(1, 3)} ${inn.slice(3, 6)}-${inn.slice(6, 8)}-${inn.slice(8, 10)}`,
      email: `info@${inn.slice(0, 5)}.ru`,
    },
    collateral: MOCK_PRODUCTS[productId].isSecured
      ? { type: isAuto ? 'Покупаемый транспорт' : 'Недвижимость', value: amount * (isAuto ? 1.15 : 1.6), owner: 'Компания' }
      : null,
    scoringReadyAt: null,
  }
}

/** Applications received `hoursAgo` before `now`, with the decisions the seeds already carry. */
export function createSeedRecords(now: number): SeedRecord[] {
  return ROWS.map((row) => toRecord(row, now))
}

/** The hours after receiving at which the seeded decisions were made. */
export const SEEDED_DECISION_DELAY_IN_HOURS: Record<string, number> = { approved: 20, rejected: 26, clarify: 4 }
export const SCORING_DURATION_IN_MINUTES = 9
export const ASSIGNMENT_DELAY_IN_MINUTES = 40
export const SCORING_STEP_IN_MS = 12_000
export const SEED_HOUR = HOUR
