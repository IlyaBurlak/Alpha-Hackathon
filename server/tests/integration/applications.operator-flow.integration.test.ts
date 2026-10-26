import { test, before } from 'node:test';
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
  waitForScoreStatusChange,
} from './helpers';

const CREDIT_TIME_WITHIN_RANGE = { units: 'MONTH' as const, value: 12 };
const OPERATOR_LOGIN = 'alfaOperator1';
const OPERATOR_PASSWORD = 'alfaOperator1!';

let sharedOperatorToken: string;

before(async () => {
  sharedOperatorToken = await loginOperator(OPERATOR_LOGIN, OPERATOR_PASSWORD);
});

async function takeApplication(operatorToken: string, applicationId: number): Promise<void> {
  const res = await fetch(`${SERVER_BASE_URL}/api/applications/${applicationId}/take`, {
    method: 'POST',
    headers: authHeaders(operatorToken),
  });
  assert.equal(res.status, 200);
}

async function saveOperatorSolution(operatorToken: string, applicationId: number, solution: Record<string, unknown>): Promise<Response> {
  return fetch(`${SERVER_BASE_URL}/api/applications/${applicationId}/solution`, {
    method: 'POST',
    headers: authHeaders(operatorToken),
    body: JSON.stringify(solution),
  });
}

async function acceptSpecialProduct(userToken: string, applicationId: number, status: string): Promise<Response> {
  return fetch(`${SERVER_BASE_URL}/api/applications/${applicationId}/special?status=${status}`, {
    method: 'PUT',
    headers: authHeaders(userToken),
  });
}

async function signApplication(userToken: string, applicationId: number): Promise<Response> {
  return fetch(`${SERVER_BASE_URL}/api/applications/${applicationId}/sign`, {
    method: 'PUT',
    headers: authHeaders(userToken),
  });
}

async function prepareForOperatorSolution(userToken: string, operatorToken: string): Promise<number> {
  const applicationId = await createConfirmedApplicationId(userToken, operatorToken);
  await takeApplication(operatorToken, applicationId);
  return applicationId;
}

test('an operator can take an unassigned application', async () => {
  await suite('Applications');
  await feature('Operator — take');
  await description('After taking it, the application shows up in GET /all with this operator attached.');

  const user = await step('log in as alfaTest', () => login('alfaTest', 'alfaTest!'));
  const applicationId = await step('create a fresh application', () => createConfirmedApplicationId(user, sharedOperatorToken));

  const operator = await step('log in as operator alfaOperator1', () => loginOperator(OPERATOR_LOGIN, OPERATOR_PASSWORD));
  await step('POST /:id/take', () => takeApplication(operator, applicationId));

  await step('GET /all shows this operator assigned to the application', async () => {
    const res = await fetch(`${SERVER_BASE_URL}/api/applications/all`, { headers: authHeaders(operator) });
    assert.equal(res.status, 200);
    const body = await res.json();
    const app = body.find((a: any) => a.id === applicationId);
    assert.ok(app);
    assert.equal(app.operator?.login, OPERATOR_LOGIN);
  });
});

test('taking an application with a regular user\'s token is forbidden', async () => {
  await suite('Applications');
  await feature('Operator — take');
  await description('Access-control check: a non-operator token must not pass the isAdmin gate.');

  const user = await step('log in as alfaTest', () => login('alfaTest', 'alfaTest!'));

  const res = await step('POST /1/take', () =>
    fetch(`${SERVER_BASE_URL}/api/applications/1/take`, { method: 'POST', headers: authHeaders(user) }),
  );

  await step('response is 403', () => {
    assert.equal(res.status, 403);
  });
});

test('taking an application without a token is rejected', async () => {
  await suite('Applications');
  await feature('Operator — take');
  await description('Same auth-guard shape as every other protected route.');

  const res = await step('POST /1/take with no Authorization header', () =>
    fetch(`${SERVER_BASE_URL}/api/applications/1/take`, { method: 'POST' }),
  );

  await step('response is 401', () => {
    assert.equal(res.status, 401);
  });
});

test('operator solution: APPROVED is accepted', async () => {
  await suite('Applications');
  await feature('Operator — solution (decision table)');
  await description('A fresh, taken, fully-scored application can be approved outright.');

  const user = await step('log in as alfaTest', () => login('alfaTest', 'alfaTest!'));
  const operator = await step('log in as operator alfaOperator1', () => loginOperator(OPERATOR_LOGIN, OPERATOR_PASSWORD));
  const applicationId = await step('prepare an application ready for a decision', () => prepareForOperatorSolution(user, operator));

  const res = await step('POST /:id/solution {status: APPROVED}', () =>
    saveOperatorSolution(operator, applicationId, { status: 'APPROVED' }),
  );

  await step('response is 200', () => {
    assert.equal(res.status, 200);
  });
});

test('operator solution: REJECTED is accepted', async () => {
  await suite('Applications');
  await feature('Operator — solution (decision table)');
  await description('A fresh, taken, fully-scored application can be rejected outright.');

  const user = await step('log in as alfaTest', () => login('alfaTest', 'alfaTest!'));
  const operator = await step('log in as operator alfaOperator1', () => loginOperator(OPERATOR_LOGIN, OPERATOR_PASSWORD));
  const applicationId = await step('prepare an application ready for a decision', () => prepareForOperatorSolution(user, operator));

  const res = await step('POST /:id/solution {status: REJECTED}', () =>
    saveOperatorSolution(operator, applicationId, { status: 'REJECTED' }),
  );

  await step('response is 200', () => {
    assert.equal(res.status, 200);
  });
});

test('operator solution: SPECIALPRODUCTOFFERED with a product is accepted', async () => {
  await suite('Applications');
  await feature('Operator — solution (decision table)');
  await description('Offering a special product requires the product field to be present.');

  const user = await step('log in as alfaTest', () => login('alfaTest', 'alfaTest!'));
  const operator = await step('log in as operator alfaOperator1', () => loginOperator(OPERATOR_LOGIN, OPERATOR_PASSWORD));
  const applicationId = await step('prepare an application ready for a decision', () => prepareForOperatorSolution(user, operator));

  const res = await step('POST /:id/solution {status: SPECIALPRODUCTOFFERED, product: {...}}', () =>
    saveOperatorSolution(operator, applicationId, {
      status: 'SPECIALPRODUCTOFFERED',
      product: { id: 2, name: 'Special', sum: 40000, collateral: 0, payments: 'monthly', persentage: 7, creditTime: CREDIT_TIME_WITHIN_RANGE },
    }),
  );

  await step('response is 200', () => {
    assert.equal(res.status, 200);
  });
});

test('operator solution: SPECIALPRODUCTOFFERED without a product is rejected', async () => {
  await suite('Applications');
  await feature('Operator — solution (decision table)');
  await description('The service explicitly requires a product when offering a special product.');

  const user = await step('log in as alfaTest', () => login('alfaTest', 'alfaTest!'));
  const operator = await step('log in as operator alfaOperator1', () => loginOperator(OPERATOR_LOGIN, OPERATOR_PASSWORD));
  const applicationId = await step('prepare an application ready for a decision', () => prepareForOperatorSolution(user, operator));

  const res = await step('POST /:id/solution {status: SPECIALPRODUCTOFFERED} (no product)', () =>
    saveOperatorSolution(operator, applicationId, { status: 'SPECIALPRODUCTOFFERED' }),
  );

  await step('response is 500', () => {
    assert.equal(res.status, 500);
  });
});

test('operator solution: an invalid decision status is rejected', async () => {
  await suite('Applications');
  await feature('Operator — solution (decision table)');
  await description('Only APPROVED, REJECTED and SPECIALPRODUCTOFFERED are valid operator decisions — SIGNED is not.');

  const user = await step('log in as alfaTest', () => login('alfaTest', 'alfaTest!'));
  const operator = await step('log in as operator alfaOperator1', () => loginOperator(OPERATOR_LOGIN, OPERATOR_PASSWORD));
  const applicationId = await step('prepare an application ready for a decision', () => prepareForOperatorSolution(user, operator));

  const res = await step('POST /:id/solution {status: SIGNED}', () =>
    saveOperatorSolution(operator, applicationId, { status: 'SIGNED' }),
  );

  await step('response is 500', () => {
    assert.equal(res.status, 500);
  });
});

test('operator solution with a regular user\'s token is forbidden', async () => {
  await suite('Applications');
  await feature('Operator — solution');
  await description('Access-control check: a non-operator token must not pass the isAdmin gate.');

  const user = await step('log in as alfaTest', () => login('alfaTest', 'alfaTest!'));

  const res = await step('POST /1/solution', () => saveOperatorSolution(user, 1, { status: 'APPROVED' }));

  await step('response is 403', () => {
    assert.equal(res.status, 403);
  });
});

test('operator solution without a token is rejected', async () => {
  await suite('Applications');
  await feature('Operator — solution');
  await description('Same auth-guard shape as every other protected route.');

  const res = await step('POST /1/solution with no Authorization header', () =>
    fetch(`${SERVER_BASE_URL}/api/applications/1/solution`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }),
  );

  await step('response is 401', () => {
    assert.equal(res.status, 401);
  });
});

test('special product: accepting it from SPECIALPRODUCTOFFERED succeeds', async () => {
  await suite('Applications');
  await feature('Special product (decision table)');
  await description('The owner accepts a special product the operator just offered.');

  const user = await step('log in as alfaTest', () => login('alfaTest', 'alfaTest!'));
  const operator = await step('log in as operator alfaOperator1', () => loginOperator(OPERATOR_LOGIN, OPERATOR_PASSWORD));
  const applicationId = await step('prepare an application and offer it a special product', async () => {
    const id = await prepareForOperatorSolution(user, operator);
    const res = await saveOperatorSolution(operator, id, {
      status: 'SPECIALPRODUCTOFFERED',
      product: { id: 2, name: 'Special', sum: 40000, collateral: 0, payments: 'monthly', persentage: 7, creditTime: CREDIT_TIME_WITHIN_RANGE },
    });
    assert.equal(res.status, 200);
    return id;
  });

  const res = await step('PUT /:id/special?status=SPECIALPRODUCTACCEPTED', () => acceptSpecialProduct(user, applicationId, 'SPECIALPRODUCTACCEPTED'));

  await step('response is 200', () => {
    assert.equal(res.status, 200);
  });
});

test('special product: rejecting it from SPECIALPRODUCTOFFERED succeeds', async () => {
  await suite('Applications');
  await feature('Special product (decision table)');
  await description('The owner rejects a special product the operator just offered.');

  const user = await step('log in as alfaTest', () => login('alfaTest', 'alfaTest!'));
  const operator = await step('log in as operator alfaOperator1', () => loginOperator(OPERATOR_LOGIN, OPERATOR_PASSWORD));
  const applicationId = await step('prepare an application and offer it a special product', async () => {
    const id = await prepareForOperatorSolution(user, operator);
    const res = await saveOperatorSolution(operator, id, {
      status: 'SPECIALPRODUCTOFFERED',
      product: { id: 2, name: 'Special', sum: 40000, collateral: 0, payments: 'monthly', persentage: 7, creditTime: CREDIT_TIME_WITHIN_RANGE },
    });
    assert.equal(res.status, 200);
    return id;
  });

  const res = await step('PUT /:id/special?status=SPECIALPRODUCTREJECTED', () => acceptSpecialProduct(user, applicationId, 'SPECIALPRODUCTREJECTED'));

  await step('response is 200', () => {
    assert.equal(res.status, 200);
  });
});

test('special product: an invalid decision status is rejected', async () => {
  await suite('Applications');
  await feature('Special product (decision table)');
  await description('Only SPECIALPRODUCTACCEPTED/SPECIALPRODUCTREJECTED are valid responses to an offer.');

  const user = await step('log in as alfaTest', () => login('alfaTest', 'alfaTest!'));
  const operator = await step('log in as operator alfaOperator1', () => loginOperator(OPERATOR_LOGIN, OPERATOR_PASSWORD));
  const applicationId = await step('prepare an application and offer it a special product', async () => {
    const id = await prepareForOperatorSolution(user, operator);
    const res = await saveOperatorSolution(operator, id, {
      status: 'SPECIALPRODUCTOFFERED',
      product: { id: 2, name: 'Special', sum: 40000, collateral: 0, payments: 'monthly', persentage: 7, creditTime: CREDIT_TIME_WITHIN_RANGE },
    });
    assert.equal(res.status, 200);
    return id;
  });

  const res = await step('PUT /:id/special?status=APPROVED', () => acceptSpecialProduct(user, applicationId, 'APPROVED'));

  await step('response is 500', () => {
    assert.equal(res.status, 500);
  });
});

test('special product: responding when not in SPECIALPRODUCTOFFERED is rejected', async () => {
  await suite('Applications');
  await feature('Special product (decision table)');
  await description('A freshly confirmed application is SUBMITTED, not SPECIALPRODUCTOFFERED.');

  const user = await step('log in as alfaTest', () => login('alfaTest', 'alfaTest!'));
  const applicationId = await step('create and confirm a fresh application', () => createConfirmedApplicationId(user, sharedOperatorToken));

  const res = await step('PUT /:id/special?status=SPECIALPRODUCTACCEPTED', () => acceptSpecialProduct(user, applicationId, 'SPECIALPRODUCTACCEPTED'));

  await step('response is 500', () => {
    assert.equal(res.status, 500);
  });
});

test('special product: responding to someone else\'s application is rejected', async () => {
  await suite('Applications');
  await feature('Special product — access control');
  await description('Application 1 belongs to alfaAngelika, not alfaTest.');

  const user = await step('log in as alfaTest', () => login('alfaTest', 'alfaTest!'));

  const res = await step('PUT /1/special?status=SPECIALPRODUCTACCEPTED', () => acceptSpecialProduct(user, 1, 'SPECIALPRODUCTACCEPTED'));

  await step('response is 500', () => {
    assert.equal(res.status, 500);
  });
});

test('special product: responding without a token is rejected', async () => {
  await suite('Applications');
  await feature('Special product');
  await description('Same auth-guard shape as every other protected route.');

  const res = await step('PUT /1/special?status=SPECIALPRODUCTACCEPTED with no Authorization header', () =>
    fetch(`${SERVER_BASE_URL}/api/applications/1/special?status=SPECIALPRODUCTACCEPTED`, { method: 'PUT' }),
  );

  await step('response is 401', () => {
    assert.equal(res.status, 401);
  });
});

test('sign: an APPROVED application can be signed', async () => {
  await suite('Applications');
  await feature('Sign (decision table)');
  await description('APPROVED is one of the two statuses signApplication accepts.');

  const user = await step('log in as alfaTest', () => login('alfaTest', 'alfaTest!'));
  const operator = await step('log in as operator alfaOperator1', () => loginOperator(OPERATOR_LOGIN, OPERATOR_PASSWORD));
  const applicationId = await step('prepare and approve an application', async () => {
    const id = await prepareForOperatorSolution(user, operator);
    const res = await saveOperatorSolution(operator, id, { status: 'APPROVED' });
    assert.equal(res.status, 200);
    return id;
  });

  const res = await step('PUT /:id/sign', () => signApplication(user, applicationId));

  await step('response is 200', () => {
    assert.equal(res.status, 200);
  });
});

test('sign: a SPECIALPRODUCTACCEPTED application can be signed', async () => {
  await suite('Applications');
  await feature('Sign (decision table)');
  await description('SPECIALPRODUCTACCEPTED is the other status signApplication accepts.');

  const user = await step('log in as alfaTest', () => login('alfaTest', 'alfaTest!'));
  const operator = await step('log in as operator alfaOperator1', () => loginOperator(OPERATOR_LOGIN, OPERATOR_PASSWORD));
  const applicationId = await step('prepare, offer a special product, and accept it', async () => {
    const id = await prepareForOperatorSolution(user, operator);
    const offerRes = await saveOperatorSolution(operator, id, {
      status: 'SPECIALPRODUCTOFFERED',
      product: { id: 2, name: 'Special', sum: 40000, collateral: 0, payments: 'monthly', persentage: 7, creditTime: CREDIT_TIME_WITHIN_RANGE },
    });
    assert.equal(offerRes.status, 200);
    const acceptRes = await acceptSpecialProduct(user, id, 'SPECIALPRODUCTACCEPTED');
    assert.equal(acceptRes.status, 200);
    return id;
  });

  const res = await step('PUT /:id/sign', () => signApplication(user, applicationId));

  await step('response is 200', () => {
    assert.equal(res.status, 200);
  });
});

test('sign: a SUBMITTED application cannot be signed yet', async () => {
  await suite('Applications');
  await feature('Sign (decision table)');
  await description('A freshly confirmed application is SUBMITTED — no operator decision has been made yet.');

  const user = await step('log in as alfaTest', () => login('alfaTest', 'alfaTest!'));
  const applicationId = await step('create and confirm a fresh application', () => createConfirmedApplicationId(user, sharedOperatorToken));

  const res = await step('PUT /:id/sign', () => signApplication(user, applicationId));

  await step('response is 500', () => {
    assert.equal(res.status, 500);
  });
});

test('sign: signing someone else\'s application is rejected', async () => {
  await suite('Applications');
  await feature('Sign — access control');
  await description('Application 1 belongs to alfaAngelika, not alfaTest — even though it is already SIGNED.');

  const user = await step('log in as alfaTest', () => login('alfaTest', 'alfaTest!'));

  const res = await step('PUT /1/sign', () => signApplication(user, 1));

  await step('response is 500', () => {
    assert.equal(res.status, 500);
  });
});

test('sign: signing without a token is rejected', async () => {
  await suite('Applications');
  await feature('Sign');
  await description('Same auth-guard shape as every other protected route.');

  const res = await step('PUT /1/sign with no Authorization header', () =>
    fetch(`${SERVER_BASE_URL}/api/applications/1/sign`, { method: 'PUT' }),
  );

  await step('response is 401', () => {
    assert.equal(res.status, 401);
  });
});

test('restart scoring: a SUBMITTED application can be restarted by an operator', async () => {
  await suite('Applications');
  await feature('Restart scoring');
  await description('A freshly confirmed application is SUBMITTED, which is the one status restartScoring accepts.');

  const user = await step('log in as alfaTest', () => login('alfaTest', 'alfaTest!'));
  const applicationId = await step('create and confirm a fresh application', () => createConfirmedApplicationId(user, sharedOperatorToken));

  await step('disable the register mock so the restart is observable mid-flight', () => setMockActive('register', false));
  try {
    const res = await step('POST /:id/restart', () =>
      fetch(`${SERVER_BASE_URL}/api/applications/${applicationId}/restart`, { method: 'POST', headers: authHeaders(sharedOperatorToken) }),
    );

    await step('response is 200', () => {
      assert.equal(res.status, 200);
    });

    await step('scoring leaves WAITONGOPERATOR while the register mock is down, proving the chain actually restarted', () =>
      waitForScoreStatusChange(sharedOperatorToken, applicationId, 'WAITONGOPERATOR', { timeoutMs: 3000, intervalMs: 100 }),
    );
  } finally {
    await step('re-enable the register mock', () => setMockActive('register', true));
  }

  await step('scoring settles again after the restart', () =>
    waitForScoreStatus(sharedOperatorToken, applicationId, 'WAITONGOPERATOR', { timeoutMs: 20000 }),
  );
});

test('restart scoring with a regular user\'s token is forbidden', async () => {
  await suite('Applications');
  await feature('Restart scoring');
  await description('Access-control check: a non-operator token must not pass the isAdmin gate.');

  const user = await step('log in as alfaTest', () => login('alfaTest', 'alfaTest!'));

  const res = await step('POST /1/restart', () =>
    fetch(`${SERVER_BASE_URL}/api/applications/1/restart`, { method: 'POST', headers: authHeaders(user) }),
  );

  await step('response is 403', () => {
    assert.equal(res.status, 403);
  });
});

test('restart scoring without a token is rejected', async () => {
  await suite('Applications');
  await feature('Restart scoring');
  await description('Same auth-guard shape as every other protected route.');

  const res = await step('POST /1/restart with no Authorization header', () =>
    fetch(`${SERVER_BASE_URL}/api/applications/1/restart`, { method: 'POST' }),
  );

  await step('response is 401', () => {
    assert.equal(res.status, 401);
  });
});
