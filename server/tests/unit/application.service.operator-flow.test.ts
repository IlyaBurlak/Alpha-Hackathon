import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { ApplicationService } from '../../src/api/applications/application.service';
import { ApplicationStatus } from '../../src/api/applications/entity/application.entity';
import type { IApplicationRepository } from '../../src/api/applications/application.repository.interface';
import type { IUserRepository } from '../../src/api/user/user.repository.interface';
import type { IGatewayService } from '../../src/api/gateway/gateway.service.interface';
import type { OperatorSolution } from '../../src/api/applications/entity/operator.solution';
import { buildApplication } from './fixtures/application';

const NOOP_GATEWAY: IGatewayService = {
  getBanksProducts: async () => [],
  getCreditBureauHistory: async () => undefined,
  getRegisterInfo: async () => undefined,
  getMlScoring: async () => undefined,
};

function buildService(repoOverrides: Partial<Record<keyof IApplicationRepository, unknown>> = {}) {
  const fakeAppRepo = {
    getApplicationById: mock.fn(async () => buildApplication()),
    getApplicationWithScore: mock.fn(async () => buildApplication({ status: ApplicationStatus.SUBMITTED })),
    updateApplicationStatus: mock.fn(async () => undefined),
    saveOperatorSolution: mock.fn(async () => undefined),
    ...repoOverrides,
  } as unknown as IApplicationRepository;
  const fakeUserRepo = {} as IUserRepository;
  const service = new ApplicationService(fakeAppRepo, fakeUserRepo, NOOP_GATEWAY);
  return { service, fakeAppRepo };
}

test('saveOperatorSolution rejects SPECIALPRODUCTOFFERED without a product', async () => {
  const { service } = buildService();
  const solution = { status: ApplicationStatus.SPECIALPRODUCTOFFERED } as OperatorSolution;

  await assert.rejects(
    () => service.saveOperatorSolution(1, solution, 10),
    /Не указан продукт/,
  );
});

test('saveOperatorSolution rejects a status outside the allowed set', async () => {
  const { service } = buildService();
  const solution = { status: ApplicationStatus.DRAFT } as OperatorSolution;

  await assert.rejects(
    () => service.saveOperatorSolution(1, solution, 10),
    /Неверный статус решения оператора/,
  );
});

test('saveOperatorSolution delegates to the repository for a valid APPROVED solution', async () => {
  const { service, fakeAppRepo } = buildService();
  const solution = { status: ApplicationStatus.APPROVED, comment: 'ok' } as OperatorSolution;

  await service.saveOperatorSolution(1, solution, 10);

  const repoMock = fakeAppRepo.saveOperatorSolution as unknown as ReturnType<typeof mock.fn>;
  assert.equal(repoMock.mock.callCount(), 1);
  assert.deepEqual(repoMock.mock.calls[0].arguments, [1, solution, 10]);
});

test('saveOperatorSolution accepts SPECIALPRODUCTOFFERED when a product is included', async () => {
  const { service, fakeAppRepo } = buildService();
  const solution = {
    status: ApplicationStatus.SPECIALPRODUCTOFFERED,
    product: { id: 1, name: 'test' },
  } as OperatorSolution;

  await service.saveOperatorSolution(1, solution, 10);

  const repoMock = fakeAppRepo.saveOperatorSolution as unknown as ReturnType<typeof mock.fn>;
  assert.equal(repoMock.mock.callCount(), 1);
});

test('acceptSpecialProduct rejects a status outside the allowed set', async () => {
  const { service } = buildService();

  await assert.rejects(
    () => service.acceptSpecialProduct(1, ApplicationStatus.APPROVED, 1),
    /Неверный статус решения пользователя/,
  );
});

test('acceptSpecialProduct rejects when the application belongs to another user', async () => {
  const { service } = buildService({
    getApplicationById: mock.fn(async () => buildApplication({ userId: 2 })),
  });

  await assert.rejects(
    () => service.acceptSpecialProduct(1, ApplicationStatus.SPECIALPRODUCTACCEPTED, 1),
    /Нет доступа к заявке/,
  );
});

test('acceptSpecialProduct rejects when the application is not SPECIALPRODUCTOFFERED', async () => {
  const { service } = buildService({
    getApplicationById: mock.fn(async () => buildApplication({ status: ApplicationStatus.APPROVED })),
  });

  await assert.rejects(() => service.acceptSpecialProduct(1, ApplicationStatus.SPECIALPRODUCTACCEPTED, 1));
});

test('acceptSpecialProduct updates the status for a valid request', async () => {
  const { service, fakeAppRepo } = buildService({
    getApplicationById: mock.fn(async () => buildApplication({ userId: 1, status: ApplicationStatus.SPECIALPRODUCTOFFERED })),
  });

  await service.acceptSpecialProduct(1, ApplicationStatus.SPECIALPRODUCTACCEPTED, 1);

  const repoMock = fakeAppRepo.updateApplicationStatus as unknown as ReturnType<typeof mock.fn>;
  assert.equal(repoMock.mock.callCount(), 1);
  assert.deepEqual(repoMock.mock.calls[0].arguments, [1, ApplicationStatus.SPECIALPRODUCTACCEPTED]);
});

test('signApplication rejects when the application belongs to another user', async () => {
  const { service } = buildService({
    getApplicationById: mock.fn(async () => buildApplication({ userId: 2, status: ApplicationStatus.APPROVED })),
  });

  await assert.rejects(() => service.signApplication(1, 1), /Нет доступа к заявке/);
});

test('signApplication rejects a status outside SPECIALPRODUCTACCEPTED/APPROVED', async () => {
  const { service } = buildService({
    getApplicationById: mock.fn(async () => buildApplication({ userId: 1, status: ApplicationStatus.SPECIALPRODUCTOFFERED })),
  });

  await assert.rejects(() => service.signApplication(1, 1));
});

test('signApplication moves an APPROVED application to SIGNED', async () => {
  const { service, fakeAppRepo } = buildService({
    getApplicationById: mock.fn(async () => buildApplication({ userId: 1, status: ApplicationStatus.APPROVED })),
  });

  await service.signApplication(1, 1);

  const repoMock = fakeAppRepo.updateApplicationStatus as unknown as ReturnType<typeof mock.fn>;
  assert.deepEqual(repoMock.mock.calls[0].arguments, [1, ApplicationStatus.SIGNED]);
});

test('signApplication also accepts a SPECIALPRODUCTACCEPTED application', async () => {
  const { service, fakeAppRepo } = buildService({
    getApplicationById: mock.fn(async () => buildApplication({ userId: 1, status: ApplicationStatus.SPECIALPRODUCTACCEPTED })),
  });

  await service.signApplication(1, 1);

  const repoMock = fakeAppRepo.updateApplicationStatus as unknown as ReturnType<typeof mock.fn>;
  assert.equal(repoMock.mock.callCount(), 1);
});

test('restartScoring rejects an application that is not SUBMITTED', async () => {
  const { service } = buildService({
    getApplicationWithScore: mock.fn(async () => buildApplication({ status: ApplicationStatus.APPROVED })),
  });

  await assert.rejects(() => service.restartScoring(1), /не находится в статусе SUBMITTED/);
});

test('getAllApplicationsForOperator delegates to the repository', async () => {
  const applications = [buildApplication()];
  const { service } = buildService({
    getAllApplicationsForOperator: mock.fn(async () => applications),
  });

  assert.equal(await service.getAllApplicationsForOperator(), applications);
});

test('takeApplicationForOperator delegates to the repository', async () => {
  const { service, fakeAppRepo } = buildService({
    takeApplicationForOperator: mock.fn(async () => undefined),
  });

  await service.takeApplicationForOperator(1, 10);

  const repoMock = fakeAppRepo.takeApplicationForOperator as unknown as ReturnType<typeof mock.fn>;
  assert.deepEqual(repoMock.mock.calls[0].arguments, [1, 10]);
});

test('updateApplicationStatus delegates to the repository', async () => {
  const { service, fakeAppRepo } = buildService();

  await service.updateApplicationStatus(1, ApplicationStatus.APPROVED);

  const repoMock = fakeAppRepo.updateApplicationStatus as unknown as ReturnType<typeof mock.fn>;
  assert.deepEqual(repoMock.mock.calls[0].arguments, [1, ApplicationStatus.APPROVED]);
});
