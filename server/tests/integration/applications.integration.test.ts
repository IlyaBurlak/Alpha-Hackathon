import { test } from 'node:test';
import assert from 'node:assert/strict';
import { step, description, suite, feature } from 'allure-js-commons';
import {
  SERVER_BASE_URL,
  login,
  loginOperator,
  authHeaders,
  createApplication,
  getApplicationById,
  setMockActive,
} from './helpers';

const CREDIT_TIME_WITHIN_RANGE = { units: 'MONTH' as const, value: 12 };

async function createdApplicationBody(token: string, sum: number, creditTime = CREDIT_TIME_WITHIN_RANGE) {
  const res = await createApplication(token, { organizationId: 1, sum, creditTime });
  assert.equal(res.status, 200);
  return res.json();
}

test('creating an application for one\'s own organization returns available products', async () => {
  await suite('Applications');
  await feature('Create');
  await description('alfaTest owns organization 1 (OO) — a sum/term inside at least one bank product\'s range should come back with that product attached.');

  const token = await step('log in as alfaTest', () => login('alfaTest', 'alfaTest!'));

  const body = await step('POST / with sum 50000, 12 months', () => createdApplicationBody(token, 50000));

  await step('products is a non-empty array', () => {
    assert.ok(Array.isArray(body.products));
    assert.ok(body.products.length > 0);
  });
});

test('creating an application without a token is rejected', async () => {
  await suite('Applications');
  await feature('Create');
  await description('Same auth-guard shape as every other protected route.');

  const res = await step('POST / with no Authorization header', () =>
    fetch(`${SERVER_BASE_URL}/api/applications/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organizationId: 1, sum: 50000, creditTime: CREDIT_TIME_WITHIN_RANGE }),
    }),
  );

  await step('response is 401', () => {
    assert.equal(res.status, 401);
  });
});

test('creating an application for an organization the user has no link to is rejected', async () => {
  await suite('Applications');
  await feature('Create');
  await description('alfaTest is only linked to organization 1, not organization 2 ("ООО Кот не знает").');

  const token = await step('log in as alfaTest', () => login('alfaTest', 'alfaTest!'));

  const res = await step('POST / with organizationId 2', () =>
    createApplication(token, { organizationId: 2, sum: 50000, creditTime: CREDIT_TIME_WITHIN_RANGE }),
  );

  await step('response is 500', () => {
    assert.equal(res.status, 500);
  });
});

test('creating an application without creditTime in the body is rejected', async () => {
  await suite('Applications');
  await feature('Create');
  await description('The controller reads `creditTime.units` unconditionally, so a missing creditTime surfaces as a 500, not a 400.');

  const token = await step('log in as alfaTest', () => login('alfaTest', 'alfaTest!'));

  const res = await step('POST / with no creditTime field', () =>
    fetch(`${SERVER_BASE_URL}/api/applications/`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ organizationId: 1, sum: 50000 }),
    }),
  );

  await step('response is 500', () => {
    assert.equal(res.status, 500);
  });
});

test('sum at a product\'s minSum boundary includes that product', async () => {
  await suite('Applications');
  await feature('Create — boundary value analysis');
  await description('Product id 2 has minSum 10000 — a sum exactly at that boundary must include it.');

  const token = await step('log in as alfaTest', () => login('alfaTest', 'alfaTest!'));
  const body = await step('POST / with sum 10000', () => createdApplicationBody(token, 10000));

  await step('product id 2 is present', () => {
    assert.ok(body.products.some((p: any) => p.id === 2));
  });
});

test('sum just below a product\'s minSum excludes that product', async () => {
  await suite('Applications');
  await feature('Create — boundary value analysis');
  await description('One below product id 2\'s minSum (10000) must exclude it.');

  const token = await step('log in as alfaTest', () => login('alfaTest', 'alfaTest!'));
  const body = await step('POST / with sum 9999', () => createdApplicationBody(token, 9999));

  await step('product id 2 is absent', () => {
    assert.ok(!body.products.some((p: any) => p.id === 2));
  });
});

test('sum at a product\'s maxSum boundary includes that product', async () => {
  await suite('Applications');
  await feature('Create — boundary value analysis');
  await description('Product id 2 has maxSum 5 000 000 — a sum exactly at that boundary must include it.');

  const token = await step('log in as alfaTest', () => login('alfaTest', 'alfaTest!'));
  const body = await step('POST / with sum 5000000', () => createdApplicationBody(token, 5000000));

  await step('product id 2 is present', () => {
    assert.ok(body.products.some((p: any) => p.id === 2));
  });
});

test('sum just above a product\'s maxSum excludes that product', async () => {
  await suite('Applications');
  await feature('Create — boundary value analysis');
  await description('One above product id 2\'s maxSum (5 000 000) must exclude it.');

  const token = await step('log in as alfaTest', () => login('alfaTest', 'alfaTest!'));
  const body = await step('POST / with sum 5000001', () => createdApplicationBody(token, 5000001));

  await step('product id 2 is absent', () => {
    assert.ok(!body.products.some((p: any) => p.id === 2));
  });
});

test('credit time at a product\'s minCreditTime boundary includes that product', async () => {
  await suite('Applications');
  await feature('Create — boundary value analysis');
  await description('Product id 2 has minCreditTime 6 months (180 days) — a term exactly at that boundary must include it.');

  const token = await step('log in as alfaTest', () => login('alfaTest', 'alfaTest!'));
  const body = await step('POST / with creditTime 6 months', () =>
    createdApplicationBody(token, 50000, { units: 'MONTH', value: 6 }),
  );

  await step('product id 2 is present', () => {
    assert.ok(body.products.some((p: any) => p.id === 2));
  });
});

test('credit time just below a product\'s minCreditTime excludes that product', async () => {
  await suite('Applications');
  await feature('Create — boundary value analysis');
  await description('5 months (150 days) is below product id 2\'s minCreditTime of 6 months (180 days).');

  const token = await step('log in as alfaTest', () => login('alfaTest', 'alfaTest!'));
  const body = await step('POST / with creditTime 5 months', () =>
    createdApplicationBody(token, 50000, { units: 'MONTH', value: 5 }),
  );

  await step('product id 2 is absent', () => {
    assert.ok(!body.products.some((p: any) => p.id === 2));
  });
});

test('credit time at a product\'s maxCreditTime boundary includes that product', async () => {
  await suite('Applications');
  await feature('Create — boundary value analysis');
  await description('Product id 2 has maxCreditTime 60 months (1800 days) — a term exactly at that boundary must include it.');

  const token = await step('log in as alfaTest', () => login('alfaTest', 'alfaTest!'));
  const body = await step('POST / with creditTime 60 months', () =>
    createdApplicationBody(token, 50000, { units: 'MONTH', value: 60 }),
  );

  await step('product id 2 is present', () => {
    assert.ok(body.products.some((p: any) => p.id === 2));
  });
});

test('credit time just above a product\'s maxCreditTime excludes that product', async () => {
  await suite('Applications');
  await feature('Create — boundary value analysis');
  await description('61 months (1830 days) is above product id 2\'s maxCreditTime of 60 months (1800 days).');

  const token = await step('log in as alfaTest', () => login('alfaTest', 'alfaTest!'));
  const body = await step('POST / with creditTime 61 months', () =>
    createdApplicationBody(token, 50000, { units: 'MONTH', value: 61 }),
  );

  await step('product id 2 is absent', () => {
    assert.ok(!body.products.some((p: any) => p.id === 2));
  });
});

test('creating an application while the bank mock is down still succeeds, with no products', async () => {
  await suite('Applications');
  await feature('External degradation');
  await description('filterAvailableProducts returns undefined when the gateway call fails, so the application is created but never gets a `products` field.');

  const token = await step('log in as alfaTest', () => login('alfaTest', 'alfaTest!'));

  await step('disable the bank mock', () => setMockActive('banks', false));
  try {
    const body = await step('POST / with sum 50000', async () => {
      const res = await createApplication(token, { organizationId: 1, sum: 50000, creditTime: CREDIT_TIME_WITHIN_RANGE });
      assert.equal(res.status, 200);
      return res.json();
    });

    await step('response has no products field', () => {
      assert.equal(body.products, undefined);
    });
  } finally {
    await step('re-enable the bank mock', () => setMockActive('banks', true));
  }
});

test('GET /my returns only the authenticated user\'s applications', async () => {
  await suite('Applications');
  await feature('Read');
  await description('alfaAngelika is seeded with applications 1 and 2, both already SIGNED.');

  const token = await step('log in as alfaAngelika', () => login('alfaAngelika', 'alfaAngelika!'));

  const res = await step('GET /my', () => fetch(`${SERVER_BASE_URL}/api/applications/my`, { headers: authHeaders(token) }));

  await step('response contains exactly applications 1 and 2', async () => {
    assert.equal(res.status, 200);
    const body = await res.json();
    const ids = body.map((app: any) => app.id).sort((a: number, b: number) => a - b);
    assert.deepEqual(ids, [1, 2]);
  });
});

test('GET /my returns an empty array for a user with no applications', async () => {
  await suite('Applications');
  await feature('Read');
  await description('alfaIvan is seeded with organizations but no applications, and is never used to create one elsewhere in this suite.');

  const token = await step('log in as alfaIvan', () => login('alfaIvan', 'alfaIvan!'));

  const res = await step('GET /my', () => fetch(`${SERVER_BASE_URL}/api/applications/my`, { headers: authHeaders(token) }));

  await step('response is an empty array', async () => {
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), []);
  });
});

test('GET /my without a token is rejected', async () => {
  await suite('Applications');
  await feature('Read');
  await description('Same auth-guard shape as every other protected route.');

  const res = await step('GET /my with no Authorization header', () => fetch(`${SERVER_BASE_URL}/api/applications/my`));

  await step('response is 401', () => {
    assert.equal(res.status, 401);
  });
});

test('GET /:id returns a seeded application with its product already chosen, without re-fetching bank products', async () => {
  await suite('Applications');
  await feature('Read');
  await description('Application 1 already has a productId, so application.service should not attach a fresh `products` list.');

  const token = await step('log in as alfaAngelika', () => login('alfaAngelika', 'alfaAngelika!'));

  const res = await step('GET /1', () => getApplicationById(token, 1));

  await step('response is 200 with the application\'s own product, and no re-fetched products list', async () => {
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.productId, 1);
    assert.equal(body.products, undefined);
  });
});

test('GET /:id for another user\'s application is rejected', async () => {
  await suite('Applications');
  await feature('Read — access control');
  await description('Application 1 belongs to alfaAngelika (user 2), not alfaTest (user 1).');

  const token = await step('log in as alfaTest', () => login('alfaTest', 'alfaTest!'));

  const res = await step('GET /1', () => getApplicationById(token, 1));

  await step('response is 500', () => {
    assert.equal(res.status, 500);
  });
});

test('GET /:id for a nonexistent application is rejected', async () => {
  await suite('Applications');
  await feature('Read — error guessing');
  await description('No application with this id exists in the seed data.');

  const token = await step('log in as alfaTest', () => login('alfaTest', 'alfaTest!'));

  const res = await step('GET /999999', () => getApplicationById(token, 999999));

  await step('response is 500', () => {
    assert.equal(res.status, 500);
  });
});

test('GET /:id without a token is rejected', async () => {
  await suite('Applications');
  await feature('Read');
  await description('Same auth-guard shape as every other protected route.');

  const res = await step('GET /1 with no Authorization header', () => fetch(`${SERVER_BASE_URL}/api/applications/1`));

  await step('response is 401', () => {
    assert.equal(res.status, 401);
  });
});

test('GET /all as an operator returns every applicant\'s applications', async () => {
  await suite('Applications');
  await feature('Read — operator');
  await description('Applications 1 and 2 belong to alfaAngelika, not the operator — GET /all must still include them.');

  const token = await step('log in as operator alfaOperator1', () => loginOperator('alfaOperator1', 'alfaOperator1!'));

  const res = await step('GET /all', () => fetch(`${SERVER_BASE_URL}/api/applications/all`, { headers: authHeaders(token) }));

  await step('response includes applications 1 and 2', async () => {
    assert.equal(res.status, 200);
    const body = await res.json();
    const ids = body.map((app: any) => app.id);
    assert.ok(ids.includes(1));
    assert.ok(ids.includes(2));
  });
});

test('GET /all with a regular user\'s token is forbidden', async () => {
  await suite('Applications');
  await feature('Read — operator');
  await description('Access-control check: a non-operator token must not pass the isAdmin gate.');

  const token = await step('log in as alfaTest (not an operator)', () => login('alfaTest', 'alfaTest!'));

  const res = await step('GET /all', () => fetch(`${SERVER_BASE_URL}/api/applications/all`, { headers: authHeaders(token) }));

  await step('response is 403', () => {
    assert.equal(res.status, 403);
  });
});

test('GET /all without a token is rejected', async () => {
  await suite('Applications');
  await feature('Read — operator');
  await description('Same auth-guard shape as every other protected route.');

  const res = await step('GET /all with no Authorization header', () => fetch(`${SERVER_BASE_URL}/api/applications/all`));

  await step('response is 401', () => {
    assert.equal(res.status, 401);
  });
});

test('GET /:id/score as an operator returns the scoring details for a seeded, already-scored application', async () => {
  await suite('Applications');
  await feature('Read — operator');
  await description('Application 1 was seeded with a full scoring record (history, registerInfo, mlScore).');

  const token = await step('log in as operator alfaOperator1', () => loginOperator('alfaOperator1', 'alfaOperator1!'));

  const res = await step('GET /1/score', () => fetch(`${SERVER_BASE_URL}/api/applications/1/score`, { headers: authHeaders(token) }));

  await step('response is 200 with history/registerInfo/mlScore present', async () => {
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.applicationScore);
    assert.ok(body.applicationScore.history);
    assert.ok(body.applicationScore.registerInfo);
    assert.ok(body.applicationScore.mlScore);
  });
});

test('GET /:id/score with a regular user\'s token is forbidden', async () => {
  await suite('Applications');
  await feature('Read — operator');
  await description('Access-control check: a non-operator token must not pass the isAdmin gate, even for their own application.');

  const token = await step('log in as alfaAngelika (owns application 1, but is not an operator)', () => login('alfaAngelika', 'alfaAngelika!'));

  const res = await step('GET /1/score', () => fetch(`${SERVER_BASE_URL}/api/applications/1/score`, { headers: authHeaders(token) }));

  await step('response is 403', () => {
    assert.equal(res.status, 403);
  });
});

test('GET /:id/score without a token is rejected', async () => {
  await suite('Applications');
  await feature('Read — operator');
  await description('Same auth-guard shape as every other protected route.');

  const res = await step('GET /1/score with no Authorization header', () => fetch(`${SERVER_BASE_URL}/api/applications/1/score`));

  await step('response is 401', () => {
    assert.equal(res.status, 401);
  });
});
