import { test, mock, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { GatewayService } from '../../src/api/gateway/gateway.service';
import { OrganizationType } from '../../src/api/organizations/entity/organization.entity';

beforeEach(() => {
  mock.restoreAll();
});

function mockGet(impl: (...args: any[]) => any) {
  const m = mock.method(axios, 'get', impl);
  return m;
}

function mockPost(impl: (...args: any[]) => any) {
  const m = mock.method(axios, 'post', impl);
  return m;
}

test('getBanksProducts returns the array from a 200 response', async (t) => {
  const getMock = mockGet(async () => ({ status: 200, data: [{ id: 1 }] }));
  t.after(() => getMock.mock.restore());

  const result = await new GatewayService().getBanksProducts();

  assert.deepEqual(result, [{ id: 1 }]);
});

test('getBanksProducts returns an empty array on a non-200 response', async (t) => {
  const getMock = mockGet(async () => ({ status: 503, data: [] }));
  t.after(() => getMock.mock.restore());

  const result = await new GatewayService().getBanksProducts();

  assert.deepEqual(result, []);
});

test('getBanksProducts returns an empty array when the response body is not an array', async (t) => {
  const getMock = mockGet(async () => ({ status: 200, data: { error: 'unexpected' } }));
  t.after(() => getMock.mock.restore());

  const result = await new GatewayService().getBanksProducts();

  assert.deepEqual(result, []);
});

test('getBanksProducts returns undefined when the request fails', async (t) => {
  const getMock = mockGet(async () => {
    throw new Error('network down');
  });
  t.after(() => getMock.mock.restore());

  const result = await new GatewayService().getBanksProducts();

  assert.equal(result, undefined);
});

test('getCreditBureauHistory returns the response body on success', async (t) => {
  const getMock = mockGet(async () => ({ status: 200, data: { bankrupt: false } }));
  t.after(() => getMock.mock.restore());

  const result = await new GatewayService().getCreditBureauHistory('7701234568');

  assert.deepEqual(result, { bankrupt: false });
});

test('getCreditBureauHistory returns undefined when the request fails', async (t) => {
  const getMock = mockGet(async () => {
    throw new Error('network down');
  });
  t.after(() => getMock.mock.restore());

  const result = await new GatewayService().getCreditBureauHistory('7701234568');

  assert.equal(result, undefined);
});

test('getRegisterInfo calls the legal-entity endpoint for OO organizations', async (t) => {
  const getMock = mockGet(async () => ({ status: 200, data: { isActive: true } }));
  t.after(() => getMock.mock.restore());

  await new GatewayService().getRegisterInfo('7701234568', OrganizationType.OO);

  assert.match(getMock.mock.calls[0].arguments[0] as string, /\/legal\?inn=7701234568$/);
});

test('getRegisterInfo calls the individual endpoint for sole proprietors', async (t) => {
  const getMock = mockGet(async () => ({ status: 200, data: { isActive: true } }));
  t.after(() => getMock.mock.restore());

  await new GatewayService().getRegisterInfo('2301234560', OrganizationType.IndividualEntrepreneur);

  assert.match(getMock.mock.calls[0].arguments[0] as string, /\/individual\?inn=2301234560$/);
});

test('getRegisterInfo returns undefined when the request fails', async (t) => {
  const getMock = mockGet(async () => {
    throw new Error('network down');
  });
  t.after(() => getMock.mock.restore());

  const result = await new GatewayService().getRegisterInfo('7701234568', OrganizationType.OO);

  assert.equal(result, undefined);
});

test('getMlScoring returns the response body on success', async (t) => {
  const postMock = mockPost(async () => ({ status: 200, data: { score: 0.1 } }));
  t.after(() => postMock.mock.restore());

  const result = await new GatewayService().getMlScoring({ id: 1 } as any);

  assert.deepEqual(result, { score: 0.1 });
});

test('getMlScoring returns undefined when the request fails', async (t) => {
  const postMock = mockPost(async () => {
    throw new Error('network down');
  });
  t.after(() => postMock.mock.restore());

  const result = await new GatewayService().getMlScoring({ id: 1 } as any);

  assert.equal(result, undefined);
});
