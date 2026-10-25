import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ApplicationService } from '../../src/api/applications/application.service';
import { CreditTimeUnits } from '../../src/api/applications/entity/application.entity';
import { OrganizationEntity, OrganizationType } from '../../src/api/organizations/entity/organization.entity';
import type { IApplicationRepository } from '../../src/api/applications/application.repository.interface';
import type { IUserRepository } from '../../src/api/user/user.repository.interface';
import type { IGatewayService } from '../../src/api/gateway/gateway.service.interface';
import { buildApplication } from './fixtures/application';

function freshBankProducts() {
  return [
    {
      id: 1,
      name: 'Кредит для бизнеса с залогом',
      minSum: 10000,
      maxSum: 100000000,
      minCreditTime: { units: 'MONTH', value: 6 },
      maxCreditTime: { units: 'MONTH', value: 60 },
      ooAvailable: true,
      ieAvailable: true,
      minCollateral: 20000,
      persentage: 10,
      payments: 'ежемесячно',
    },
    {
      id: 3,
      name: 'Кредит «Деньги на дело»',
      minSum: 0,
      maxSum: 1000000,
      minCreditTime: { units: 'MONTH', value: 3 },
      maxCreditTime: { units: 'MONTH', value: 60 },
      ooAvailable: false,
      ieAvailable: true,
      minCollateral: 10000,
      persentage: 9,
      payments: 'ежемесячно',
    },
  ];
}

function buildService() {
  const fakeAppRepo = {} as IApplicationRepository;
  const fakeUserRepo = {} as IUserRepository;
  const fakeGateway: IGatewayService = {
    getBanksProducts: async () => freshBankProducts(),
    getCreditBureauHistory: async () => undefined,
    getRegisterInfo: async () => undefined,
    getMlScoring: async () => undefined,
  };
  return new ApplicationService(fakeAppRepo, fakeUserRepo, fakeGateway);
}

const LEGAL_ENTITY = new OrganizationEntity({ id: 1, inn: '7701234568', fullName: 'ООО "Ромашка"', type: OrganizationType.OO });
const SOLE_PROPRIETOR = new OrganizationEntity({ id: 5, inn: '2301234560', fullName: 'ИП Сырный Иван', type: OrganizationType.IndividualEntrepreneur });

test('filterAvailableProducts keeps only products matching org type, sum and credit time', async () => {
  const service = buildService() as any;
  const application = buildApplication();

  const products = await service.filterAvailableProducts(application, LEGAL_ENTITY);

  assert.deepEqual(products.map((p: any) => p.id), [1]);
});

test('filterAvailableProducts includes IE-only products for sole proprietors', async () => {
  const service = buildService() as any;
  const application = buildApplication({ organizationId: 5 });

  const products = await service.filterAvailableProducts(application, SOLE_PROPRIETOR);

  assert.deepEqual(products.map((p: any) => p.id).sort(), [1, 3]);
});

test('filterAvailableProducts excludes products outside the requested sum range', async () => {
  const service = buildService() as any;

  const application = buildApplication({ organizationId: 5, sum: 2_000_000 });

  const products = await service.filterAvailableProducts(application, SOLE_PROPRIETOR);

  assert.deepEqual(products.map((p: any) => p.id), [1]);
});

test('handleProducts computes collateral from minCollateral + percentage of the sum', async () => {
  const service = buildService() as any;
  const application = buildApplication({ sum: 50000 });

  const handled = await service.handleProducts(application, [freshBankProducts()[0]]);

  assert.equal(handled[0].collateral, 25000);
});

test('handleProducts reports zero collateral when the product has none', async () => {
  const service = buildService() as any;
  const application = buildApplication({ organizationId: 5, sum: 50000 });

  const handled = await service.handleProducts(application, [{ ...freshBankProducts()[1], minCollateral: 0 }]);

  assert.equal(handled[0].collateral, 0);
});

test('convertCreditTimeToDays converts each unit to days', () => {
  const service = buildService() as any;

  assert.equal(service.convertCreditTimeToDays({ units: CreditTimeUnits.DAY, value: 5 }), 5);
  assert.equal(service.convertCreditTimeToDays({ units: CreditTimeUnits.MONTH, value: 2 }), 60);
  assert.equal(service.convertCreditTimeToDays({ units: CreditTimeUnits.YEAR, value: 1 }), 365);
  assert.equal(service.convertCreditTimeToDays({ units: 999, value: 1 }), 0);
});
