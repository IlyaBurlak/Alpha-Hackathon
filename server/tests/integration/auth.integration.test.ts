import { test } from 'node:test';
import assert from 'node:assert/strict';
import { step, description, suite, feature } from 'allure-js-commons';

const BASE_URL = process.env.SERVER_BASE_URL ?? 'http://localhost:3001';

test('login with seeded credentials returns a JWT', async () => {
  await suite('Auth');
  await feature('Login');
  await description(
    'Logs in as the seeded demo user `alfaTest` (see `server/tests/integration/README.md` ' +
      'for where these credentials come from) and checks that a non-empty JWT comes back. ' +
      'This is the prerequisite for every other authenticated test in this suite.',
  );

  const res = await step('POST /api/users/login with alfaTest/alfaTest!', () =>
    fetch(`${BASE_URL}/api/users/login`, {
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
