import { test } from 'node:test';
import assert from 'node:assert/strict';
import { UserEntity } from '../../src/api/user/entity/user.entity';
import { ApplicationEntity, ApplicationStatus, CreditTimeUnits } from '../../src/api/applications/entity/application.entity';

test('UserEntity maps Organizations into OrganizationEntity instances', () => {
  const user = new UserEntity({
    id: 1,
    login: 'alfaTest',
    fullName: 'Тестов Тест',
    password: 'hash',
    Organizations: [{ id: 1, inn: '7701234568', fullName: 'ООО "Ромашка"', type: 1 }],
  });

  assert.equal(user.organizations.length, 1);
  assert.equal(user.organizations[0].inn, '7701234568');
});

test('UserEntity defaults to an empty organizations array when none are given', () => {
  const user = new UserEntity({ id: 1, login: 'alfaTest', fullName: 'Тестов Тест', password: 'hash' });

  assert.deepEqual(user.organizations, []);
});

function baseApplicationModel(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    userId: 1,
    organizationId: 1,
    sum: 50000,
    status: ApplicationStatus.DRAFT,
    createdAt: new Date(),
    creditTimeUnits: CreditTimeUnits.MONTH,
    creditValue: 12,
    loanIssuanceDate: new Date(),
    ...overrides,
  };
}

test('ApplicationEntity does not set product/applicationScore/operator/organization when absent', () => {
  const application = new ApplicationEntity(baseApplicationModel());

  assert.equal(application.productId, undefined);
  assert.equal(application.product, undefined);
  assert.equal(application.applicationScore, undefined);
  assert.equal(application.operator, undefined);
  assert.equal(application.organization, undefined);
});

test('ApplicationEntity maps productId/product only when a product was chosen', () => {
  const application = new ApplicationEntity(
    baseApplicationModel({ productId: 7, productConditions: { name: 'Кредит' } }),
  );

  assert.equal(application.productId, 7);
  assert.deepEqual(application.product, { name: 'Кредит' });
});

test('ApplicationEntity maps a nested applicationScore', () => {
  const application = new ApplicationEntity(
    baseApplicationModel({ applicationScore: { id: 1, applicationId: 1, status: 1 } }),
  );

  assert.equal(application.applicationScore?.id, 1);
});

test('ApplicationEntity maps a nested operator and organization', () => {
  const application = new ApplicationEntity(
    baseApplicationModel({
      operator: { id: 1, login: 'alfaOperator1', fullName: 'Кошмариков Антон', password: 'hash' },
      organization: { id: 1, inn: '7701234568', fullName: 'ООО "Ромашка"', type: 1 },
    }),
  );

  assert.equal(application.operator?.login, 'alfaOperator1');
  assert.equal(application.organization?.inn, '7701234568');
});
