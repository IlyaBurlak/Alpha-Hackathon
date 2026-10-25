import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { step, description, suite, feature } from 'allure-js-commons';
import {
  SERVER_BASE_URL,
  login,
  loginOperator,
  authHeaders,
  createApplication,
  confirmApplication,
  setMockActive,
  waitForScoreStatus,
} from './helpers';

const CREDIT_TIME_WITHIN_RANGE = { units: 'MONTH' as const, value: 12 };

let operatorToken: string;

before(async () => {
  operatorToken = await loginOperator('alfaOperator1', 'alfaOperator1!');
});

async function createFreshApplicationId(token: string, sum = 50000): Promise<number> {
  const res = await createApplication(token, { organizationId: 1, sum, creditTime: CREDIT_TIME_WITHIN_RANGE });
  assert.equal(res.status, 200);
  const body = await res.json();
  return body.id;
}

async function confirmAndDrainScoring(token: string, applicationId: number, productId: number): Promise<Response> {
  const res = await confirmApplication(token, applicationId, productId);
  if (res.status === 200) {
    await waitForScoreStatus(operatorToken, applicationId, 'WAITONGOPERATOR');
  }
  return res;
}

test('confirming a product the caller is entitled to succeeds', async () => {
  await suite('Applications');
  await feature('Confirm product');
  await description('A fresh application for organization 1, confirmed with product id 2 (which is in range for sum 50000/12 months).');

  const token = await step('log in as alfaTest', () => login('alfaTest', 'alfaTest!'));
  const applicationId = await step('create a fresh application', () => createFreshApplicationId(token));

  const res = await step('PUT /?applicationId&productId=2, then wait for scoring to settle', () =>
    confirmAndDrainScoring(token, applicationId, 2),
  );

  await step('response is 200 with productId 2', async () => {
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.productId, 2);
  });
});

test('confirming without applicationId or productId in the query is rejected', async () => {
  await suite('Applications');
  await feature('Confirm product');
  await description('The controller requires both query params before calling the service.');

  const token = await step('log in as alfaTest', () => login('alfaTest', 'alfaTest!'));

  const res = await step('PUT / with no query params', () =>
    fetch(`${SERVER_BASE_URL}/api/applications/`, { method: 'PUT', headers: authHeaders(token) }),
  );

  await step('response is 400', () => {
    assert.equal(res.status, 400);
  });
});

test('confirming without a token is rejected', async () => {
  await suite('Applications');
  await feature('Confirm product');
  await description('Same auth-guard shape as every other protected route.');

  const res = await step('PUT /?applicationId=1&productId=1 with no Authorization header', () =>
    fetch(`${SERVER_BASE_URL}/api/applications/?applicationId=1&productId=1`, { method: 'PUT' }),
  );

  await step('response is 401', () => {
    assert.equal(res.status, 401);
  });
});

test('confirming someone else\'s (not yet confirmed) application is rejected', async () => {
  await suite('Applications');
  await feature('Confirm product — access control');
  await description(
    'application.service checks `application.productId` before ownership, so this needs a freshly ' +
      'created, still-unconfirmed application to actually exercise the "Нет доступа" branch.',
  );

  const owner = await step('log in as alfaTest (the owner)', () => login('alfaTest', 'alfaTest!'));
  const applicationId = await step('create a fresh application as the owner', () => createFreshApplicationId(owner));

  const intruder = await step('log in as alfaIlia (unrelated user)', () => login('alfaIlia', 'alfaIlia!'));
  const res = await step('PUT /?applicationId&productId=2 as the intruder', () => confirmApplication(intruder, applicationId, 2));

  await step('response is 500', () => {
    assert.equal(res.status, 500);
  });
});

test('confirming an already-confirmed application is rejected', async () => {
  await suite('Applications');
  await feature('Confirm product');
  await description('A second confirm call on the same application must hit the "Продукт уже выбран" guard.');

  const token = await step('log in as alfaTest', () => login('alfaTest', 'alfaTest!'));
  const applicationId = await step('create a fresh application', () => createFreshApplicationId(token));

  await step('confirm it once (expected to succeed), then wait for scoring to settle', async () => {
    const res = await confirmAndDrainScoring(token, applicationId, 2);
    assert.equal(res.status, 200);
  });

  const res = await step('confirm it again', () => confirmApplication(token, applicationId, 2));

  await step('response is 500', () => {
    assert.equal(res.status, 500);
  });
});

test('confirming a product unavailable to the application is rejected', async () => {
  await suite('Applications');
  await feature('Confirm product');
  await description('Product id 3 ("Деньги на дело") is IE-only (ieAvailable, not ooAvailable) — organization 1 is OO.');

  const token = await step('log in as alfaTest', () => login('alfaTest', 'alfaTest!'));
  const applicationId = await step('create a fresh application', () => createFreshApplicationId(token));

  const res = await step('PUT /?applicationId&productId=3', () => confirmApplication(token, applicationId, 3));

  await step('response is 500', () => {
    assert.equal(res.status, 500);
  });
});

test('confirming while the bank mock is down is rejected', async () => {
  await suite('Applications');
  await feature('External degradation');
  await description('confirmApplication re-fetches the available products and explicitly rejects when the gateway call fails.');

  const token = await step('log in as alfaTest', () => login('alfaTest', 'alfaTest!'));
  const applicationId = await step('create a fresh application while the bank mock is still up', () => createFreshApplicationId(token));

  await step('disable the bank mock', () => setMockActive('banks', false));
  try {
    const res = await step('PUT /?applicationId&productId=2', () => confirmApplication(token, applicationId, 2));

    await step('response is 500', () => {
      assert.equal(res.status, 500);
    });
  } finally {
    await step('re-enable the bank mock', () => setMockActive('banks', true));
  }
});

test('confirming triggers the async scoring chain through to WAITONGOPERATOR', async () => {
  await suite('Applications');
  await feature('Confirm product');
  await description(
    'confirmApplication fires handleApplication without awaiting it. Polling GET /:id/score as an ' +
      'operator until the scoring status reaches WAITONGOPERATOR proves the fire-and-forget chain ' +
      '(credit history -> register -> ML scoring) actually ran end to end against the real mocks.',
  );

  const token = await step('log in as alfaTest', () => login('alfaTest', 'alfaTest!'));
  const applicationId = await step('create and confirm a fresh application', async () => {
    const id = await createFreshApplicationId(token);
    const res = await confirmApplication(token, id, 2);
    assert.equal(res.status, 200);
    return id;
  });

  await step('poll /:id/score until status is WAITONGOPERATOR', () =>
    waitForScoreStatus(operatorToken, applicationId, 'WAITONGOPERATOR'),
  );
});
