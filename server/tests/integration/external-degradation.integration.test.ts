import { test } from 'node:test';
import assert from 'node:assert/strict';
import { step, description, suite, feature } from 'allure-js-commons';
import {
  SERVER_BASE_URL,
  login,
  loginOperator,
  authHeaders,
  createConfirmedApplicationId,
  setMockActive,
  waitForScoreStatus,
  getApplicationScore,
} from './helpers';

const OPERATOR_LOGIN = 'alfaOperator1';
const OPERATOR_PASSWORD = 'alfaOperator1!';

test('scoring still completes when the credit bureau mock is down, with no credit history recorded', async () => {
  await suite('Applications');
  await feature('External degradation');
  await description(
    'getCreditBureauHistory swallows the failure and returns undefined, so handleApplication skips ' +
      'storing a history but still progresses all the way to WAITONGOPERATOR instead of getting stuck or throwing.',
  );

  const user = await step('log in as alfaTest', () => login('alfaTest', 'alfaTest!'));
  const operator = await step('log in as operator alfaOperator1', () => loginOperator(OPERATOR_LOGIN, OPERATOR_PASSWORD));

  await step('disable the credit bureau mock', () => setMockActive('credit-bureaus', false));
  try {
    const applicationId = await step('create and confirm a fresh application, waiting for scoring to settle', () =>
      createConfirmedApplicationId(user, operator),
    );

    await step('no credit history was recorded', async () => {
      const body = await getApplicationScore(operator, applicationId);
      assert.equal(body.applicationScore.history?.bankrupt, undefined);
      assert.equal(body.applicationScore.history?.creditHistory, undefined);
    });
  } finally {
    await step('re-enable the credit bureau mock', () => setMockActive('credit-bureaus', true));
  }
});

test('scoring still completes when the unified register mock is down, with no register info recorded', async () => {
  await suite('Applications');
  await feature('External degradation');
  await description(
    'getRegisterInfo swallows the failure and returns undefined, so handleApplication skips storing ' +
      'register data but still progresses all the way to WAITONGOPERATOR.',
  );

  const user = await step('log in as alfaTest', () => login('alfaTest', 'alfaTest!'));
  const operator = await step('log in as operator alfaOperator1', () => loginOperator(OPERATOR_LOGIN, OPERATOR_PASSWORD));

  await step('disable the register mock', () => setMockActive('register', false));
  try {
    const applicationId = await step('create and confirm a fresh application, waiting for scoring to settle', () =>
      createConfirmedApplicationId(user, operator),
    );

    await step('no register info was recorded', async () => {
      const body = await getApplicationScore(operator, applicationId);
      assert.equal(body.applicationScore.registerInfo?.isActive, undefined);
      assert.equal(body.applicationScore.registerInfo?.ogrn, undefined);
    });
  } finally {
    await step('re-enable the register mock', () => setMockActive('register', true));
  }
});

test('scoring still completes when every external mock is down at once', async () => {
  await suite('Applications');
  await feature('External degradation');
  await description(
    'Bank, credit bureau and register all down together: creation gets no products, confirmation is ' +
      'rejected as expected (covered in applications.confirm.integration.test.ts) — this test\'s focus ' +
      'is that the async scoring chain on an already-confirmed application never throws an unhandled ' +
      'rejection and still reaches WAITONGOPERATOR with everything empty.',
  );

  const user = await step('log in as alfaTest', () => login('alfaTest', 'alfaTest!'));
  const operator = await step('log in as operator alfaOperator1', () => loginOperator(OPERATOR_LOGIN, OPERATOR_PASSWORD));

  const applicationId = await step('create and confirm a fresh application while mocks are up, waiting for scoring to settle', () =>
    createConfirmedApplicationId(user, operator),
  );

  await step('disable every external mock', async () => {
    await setMockActive('banks', false);
    await setMockActive('credit-bureaus', false);
    await setMockActive('register', false);
  });
  try {
    await step('restart scoring on that application as an operator', async () => {
      const res = await fetch(`${SERVER_BASE_URL}/api/applications/${applicationId}/restart`, {
        method: 'POST',
        headers: authHeaders(operator),
      });
      assert.equal(res.status, 200);
    });

    await step('scoring still reaches WAITONGOPERATOR, despite each failed gateway call retrying for several seconds', () =>
      waitForScoreStatus(operator, applicationId, 'WAITONGOPERATOR', { timeoutMs: 20000 }),
    );
  } finally {
    await step('re-enable every external mock', async () => {
      await setMockActive('banks', true);
      await setMockActive('credit-bureaus', true);
      await setMockActive('register', true);
    });
  }
});
