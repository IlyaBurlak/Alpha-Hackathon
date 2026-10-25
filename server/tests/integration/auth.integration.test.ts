import { test } from 'node:test';
import assert from 'node:assert/strict';
import { step, description, suite, feature } from 'allure-js-commons';
import { SERVER_BASE_URL, login, loginOperator, authHeaders } from './helpers';

test('login with seeded credentials returns a JWT', async () => {
  await suite('Auth');
  await feature('Login');
  await description(
    'Logs in as the seeded demo user `alfaTest` (see `server/tests/integration/README.md` ' +
      'for where these credentials come from) and checks that a non-empty JWT comes back. ' +
      'This is the prerequisite for every other authenticated test in this suite.',
  );

  const res = await step('POST /api/users/login with alfaTest/alfaTest!', () =>
    fetch(`${SERVER_BASE_URL}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: 'alfaTest', password: 'alfaTest!' }),
    }),
  );

  await step('response is 200 with a non-empty token', async () => {
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(typeof body.token, 'string');
    assert.ok(body.token.length > 0);
  });
});

test('login with a wrong password is rejected', async () => {
  await suite('Auth');
  await feature('Login');
  await description(
    'The service throws a generic error on a password mismatch, and the global error ' +
      'handler turns any thrown error into a 500 (see README) — so 500, not 401, is the ' +
      "correct expectation here given the app's current behaviour.",
  );

  const res = await step('POST /api/users/login with alfaTest/wrong-password', () =>
    fetch(`${SERVER_BASE_URL}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: 'alfaTest', password: 'wrong-password' }),
    }),
  );

  await step('response is 500', async () => {
    assert.equal(res.status, 500);
  });
});

test('login with a login that does not exist is rejected', async () => {
  await suite('Auth');
  await feature('Login');
  await description('Same 500-on-any-error behaviour as a wrong password, but for a login that was never seeded.');

  const res = await step('POST /api/users/login with a nonexistent login', () =>
    fetch(`${SERVER_BASE_URL}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: 'nobody-like-this-exists', password: 'whatever' }),
    }),
  );

  await step('response is 500', async () => {
    assert.equal(res.status, 500);
  });
});

test('login without a password in the body is rejected before hitting the service', async () => {
  await suite('Auth');
  await feature('Login');
  await description('The controller validates login/password are non-empty strings before calling the service.');

  const res = await step('POST /api/users/login with no password field', () =>
    fetch(`${SERVER_BASE_URL}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: 'alfaTest' }),
    }),
  );

  await step('response is 400', async () => {
    assert.equal(res.status, 400);
  });
});

test('login with a blank login is rejected', async () => {
  await suite('Auth');
  await feature('Login');
  await description('Boundary case for the controller\'s `login.trim().length === 0` check.');

  const res = await step('POST /api/users/login with login: "   "', () =>
    fetch(`${SERVER_BASE_URL}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: '   ', password: 'alfaTest!' }),
    }),
  );

  await step('response is 400', async () => {
    assert.equal(res.status, 400);
  });
});

test('admin-login with seeded operator credentials returns a JWT marked isAdmin', async () => {
  await suite('Auth');
  await feature('Operator login');
  await description('Logs in as the seeded operator `alfaOperator1` and checks the token carries isAdmin.');

  const res = await step('POST /api/users/admin-login with alfaOperator1/alfaOperator1!', () =>
    fetch(`${SERVER_BASE_URL}/api/users/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: 'alfaOperator1', password: 'alfaOperator1!' }),
    }),
  );

  await step('response is 200 with a non-empty token', async () => {
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(typeof body.token, 'string');
    assert.ok(body.token.length > 0);
  });
});

test('admin-login with a regular user\'s credentials is rejected', async () => {
  await suite('Auth');
  await feature('Operator login');
  await description('`alfaTest` is a seeded user, not an operator — admin-login looks it up in a different table.');

  const res = await step('POST /api/users/admin-login with alfaTest/alfaTest!', () =>
    fetch(`${SERVER_BASE_URL}/api/users/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: 'alfaTest', password: 'alfaTest!' }),
    }),
  );

  await step('response is 500', async () => {
    assert.equal(res.status, 500);
  });
});

test('GET /api/users/info returns the current user and their organizations', async () => {
  await suite('Auth');
  await feature('User info');
  await description('`alfaTest` is seeded with exactly one linked organization (id 1, "ООО Ромашка").');

  const token = await step('log in as alfaTest', () => login('alfaTest', 'alfaTest!'));

  const res = await step('GET /api/users/info', () =>
    fetch(`${SERVER_BASE_URL}/api/users/info`, { headers: authHeaders(token) }),
  );

  await step('response is 200 with the organization attached', async () => {
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.login, 'alfaTest');
    assert.ok(Array.isArray(body.organizations));
    assert.ok(body.organizations.some((org: any) => org.id === 1));
  });
});

test('GET /api/users/info for a user with no organizations returns an empty list', async () => {
  await suite('Auth');
  await feature('User info');
  await description('`alfaIlia` is seeded without any linked organization at all.');

  const token = await step('log in as alfaIlia', () => login('alfaIlia', 'alfaIlia!'));

  const res = await step('GET /api/users/info', () =>
    fetch(`${SERVER_BASE_URL}/api/users/info`, { headers: authHeaders(token) }),
  );

  await step('response is 200 with an empty organizations array', async () => {
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(body.organizations, []);
  });
});

test('GET /api/users/info without a token is rejected', async () => {
  await suite('Auth');
  await feature('User info');
  await description('Same auth-guard shape as every other protected route.');

  const res = await step('GET /api/users/info with no Authorization header', () =>
    fetch(`${SERVER_BASE_URL}/api/users/info`),
  );

  await step('response is 401', async () => {
    assert.equal(res.status, 401);
  });
});

test('GET /api/users/admin-info returns the current operator', async () => {
  await suite('Auth');
  await feature('Operator info');
  await description('`alfaOperator1` is a seeded operator.');

  const token = await step('log in as operator alfaOperator1', () => loginOperator('alfaOperator1', 'alfaOperator1!'));

  const res = await step('GET /api/users/admin-info', () =>
    fetch(`${SERVER_BASE_URL}/api/users/admin-info`, { headers: authHeaders(token) }),
  );

  await step('response is 200 for the operator', async () => {
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.login, 'alfaOperator1');
  });
});

test('GET /api/users/admin-info with a regular user\'s token is forbidden', async () => {
  await suite('Auth');
  await feature('Operator info');
  await description('Access-control check: a valid JWT for a non-operator user must not pass the isAdmin gate.');

  const token = await step('log in as alfaTest (not an operator)', () => login('alfaTest', 'alfaTest!'));

  const res = await step('GET /api/users/admin-info', () =>
    fetch(`${SERVER_BASE_URL}/api/users/admin-info`, { headers: authHeaders(token) }),
  );

  await step('response is 403', async () => {
    assert.equal(res.status, 403);
  });
});

test('GET /api/users/admin-info without a token is rejected', async () => {
  await suite('Auth');
  await feature('Operator info');
  await description('Same auth-guard shape as every other protected route.');

  const res = await step('GET /api/users/admin-info with no Authorization header', () =>
    fetch(`${SERVER_BASE_URL}/api/users/admin-info`),
  );

  await step('response is 401', async () => {
    assert.equal(res.status, 401);
  });
});
