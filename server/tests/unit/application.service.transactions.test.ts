import { test, mock, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { setImmediate } from 'node:timers/promises';
import { sequelize } from '../../src/database/dbconfig';
import { ApplicationService } from '../../src/api/applications/application.service';
import type { ApplicationEntity } from '../../src/api/applications/entity/application.entity';
import { OrganizationEntity, OrganizationType } from '../../src/api/organizations/entity/organization.entity';
import type { IApplicationRepository } from '../../src/api/applications/application.repository.interface';
import type { IUserRepository } from '../../src/api/user/user.repository.interface';
import type { IGatewayService } from '../../src/api/gateway/gateway.service.interface';
import { buildApplication } from './fixtures/application';

beforeEach(() => {
  mock.restoreAll();
});

// sequelize.transaction(cb) is called directly by createApplication/
// confirmApplication/getApplicationById — replacing it with a stub that just
// invokes the callback lets us exercise their real branching logic without a
// real DB connection, and without touching any production code.
function stubTransaction(t: { after: (fn: () => void) => void }) {
  const txMock = mock.method(sequelize, 'transaction', async (cb: (tx: unknown) => unknown) => cb({}));
  t.after(() => txMock.mock.restore());
}

const LEGAL_ENTITY = new OrganizationEntity({ id: 1, inn: '7701234568', fullName: 'ООО "Ромашка"', type: OrganizationType.OO });

const EMPTY_PRODUCTS_GATEWAY: IGatewayService = {
  getBanksProducts: async () => [],
  getCreditBureauHistory: async () => undefined,
  getRegisterInfo: async () => undefined,
  getMlScoring: async () => undefined,
};

function buildService(opts: {
  appRepo?: Partial<Record<keyof IApplicationRepository, unknown>>;
  userId?: number;
  organizations?: OrganizationEntity[];
  gateway?: IGatewayService;
} = {}) {
  const fakeAppRepo = {
    createApplication: mock.fn(async (app: ApplicationEntity) => app),
    getApplicationById: mock.fn(async () => buildApplication()),
    confirmApplication: mock.fn(async (id: number, product: any) => buildApplication({ id, productId: product.id })),
    createApplicationScore: mock.fn(async () => undefined),
    updateApplicationScoringStatus: mock.fn(async () => undefined),
    updateApplicationScoringInfo: mock.fn(async () => undefined),
    updateApplicationScore: mock.fn(async () => undefined),
    getApplicationWithScore: mock.fn(async () => buildApplication()),
    ...opts.appRepo,
  } as unknown as IApplicationRepository;

  const fakeUserRepo = {
    getUserById: mock.fn(async () => ({ organizations: opts.organizations ?? [LEGAL_ENTITY] })),
  } as unknown as IUserRepository;

  const service = new ApplicationService(fakeAppRepo, fakeUserRepo, opts.gateway ?? EMPTY_PRODUCTS_GATEWAY);
  return { service, fakeAppRepo, fakeUserRepo };
}

test('createApplication rejects when the user has no link to the organization', async (t) => {
  stubTransaction(t);
  const { service } = buildService({ organizations: [] });

  await assert.rejects(
    () => service.createApplication(buildApplication({ organizationId: 99 })),
    /Не найдена связь текущего пользователя с организацией/,
  );
});

test('createApplication saves the application and attaches available products', async (t) => {
  stubTransaction(t);
  const { service, fakeAppRepo } = buildService({
    gateway: { ...EMPTY_PRODUCTS_GATEWAY, getBanksProducts: async () => [
      { id: 1, name: 'A', minSum: 0, maxSum: 100000, minCreditTime: { units: 'MONTH', value: 1 }, maxCreditTime: { units: 'MONTH', value: 24 }, ooAvailable: true, ieAvailable: true, minCollateral: 0, persentage: 10 },
    ] },
  });

  const result = await service.createApplication(buildApplication());

  const createMock = fakeAppRepo.createApplication as unknown as ReturnType<typeof mock.fn>;
  assert.equal(createMock.mock.callCount(), 1);
  assert.deepEqual((result as any).products.map((p: any) => p.id), [1]);
});

test('confirmApplication rejects when a product was already chosen', async (t) => {
  stubTransaction(t);
  const { service } = buildService({
    appRepo: { getApplicationById: mock.fn(async () => buildApplication({ productId: 5 })) },
  });

  await assert.rejects(() => service.confirmApplication(1, 1, 1), /Продукт уже выбран/);
});

test('confirmApplication rejects when the application belongs to another user', async (t) => {
  stubTransaction(t);
  const { service } = buildService({
    appRepo: { getApplicationById: mock.fn(async () => buildApplication({ userId: 2 })) },
  });

  await assert.rejects(() => service.confirmApplication(1, 1, 1), /Нет доступа к заявке/);
});

test('confirmApplication rejects when the bank gateway is unavailable', async (t) => {
  stubTransaction(t);
  const { service } = buildService({
    gateway: { ...EMPTY_PRODUCTS_GATEWAY, getBanksProducts: async () => undefined },
  });

  await assert.rejects(() => service.confirmApplication(1, 1, 1), /Сервисы банка недоступны/);
});

test('confirmApplication rejects when the chosen product is not available', async (t) => {
  stubTransaction(t);
  const { service } = buildService({
    gateway: { ...EMPTY_PRODUCTS_GATEWAY, getBanksProducts: async () => [
      { id: 1, name: 'A', minSum: 0, maxSum: 100000, minCreditTime: { units: 'MONTH', value: 1 }, maxCreditTime: { units: 'MONTH', value: 24 }, ooAvailable: true, ieAvailable: true, minCollateral: 0, persentage: 10 },
    ] },
  });

  await assert.rejects(() => service.confirmApplication(1, 1, 999), /Выбранный продукт недоступен/);
});

test('confirmApplication confirms with a valid product', async (t) => {
  stubTransaction(t);
  const { service, fakeAppRepo } = buildService({
    gateway: { ...EMPTY_PRODUCTS_GATEWAY, getBanksProducts: async () => [
      { id: 1, name: 'A', minSum: 0, maxSum: 100000, minCreditTime: { units: 'MONTH', value: 1 }, maxCreditTime: { units: 'MONTH', value: 24 }, ooAvailable: true, ieAvailable: true, minCollateral: 0, persentage: 10 },
    ] },
  });

  const result = await service.confirmApplication(1, 1, 1);
  // confirmApplication fires handleApplication's scoring chain without awaiting
  // it; flush pending microtasks so it settles before the test (and mocks) go away.
  await setImmediate();

  const confirmMock = fakeAppRepo.confirmApplication as unknown as ReturnType<typeof mock.fn>;
  assert.equal(confirmMock.mock.callCount(), 1);
  assert.equal(result.productId, 1);
});

test('getApplicationById rejects when the application belongs to another user', async (t) => {
  stubTransaction(t);
  const { service } = buildService({
    appRepo: { getApplicationById: mock.fn(async () => buildApplication({ userId: 2 })) },
  });

  await assert.rejects(() => service.getApplicationById(1, 1), /Нет доступа к заявке/);
});

test('getApplicationById attaches products when no product has been chosen yet', async (t) => {
  stubTransaction(t);
  const { service } = buildService({
    gateway: { ...EMPTY_PRODUCTS_GATEWAY, getBanksProducts: async () => [
      { id: 1, name: 'A', minSum: 0, maxSum: 100000, minCreditTime: { units: 'MONTH', value: 1 }, maxCreditTime: { units: 'MONTH', value: 24 }, ooAvailable: true, ieAvailable: true, minCollateral: 0, persentage: 10 },
    ] },
    appRepo: { getApplicationById: mock.fn(async () => buildApplication({ userId: 1 })) },
  });

  const result = await service.getApplicationById(1, 1);

  assert.deepEqual((result as any).products.map((p: any) => p.id), [1]);
});

test('getApplicationById does not fetch products when a product was already chosen', async (t) => {
  stubTransaction(t);
  const { service, fakeUserRepo } = buildService({
    appRepo: { getApplicationById: mock.fn(async () => buildApplication({ userId: 1, productId: 5 })) },
  });

  await service.getApplicationById(1, 1);

  const userRepoMock = fakeUserRepo.getUserById as unknown as ReturnType<typeof mock.fn>;
  assert.equal(userRepoMock.mock.callCount(), 0);
});
