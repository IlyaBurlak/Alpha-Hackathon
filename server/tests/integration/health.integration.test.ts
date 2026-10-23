import { test } from 'node:test';
import assert from 'node:assert/strict';
import { step, description, suite, feature } from 'allure-js-commons';

const BASE_URL = process.env.SERVER_BASE_URL ?? 'http://localhost:3001';

test('GET /health returns ok', async () => {
  await suite('Boot & health');
  await feature('Health check');
  await description(
    'Regression guard for the CreditTimeDto/ProductDto TDZ bug: that crash happened ' +
      'at module-load time, before Express ever bound a port, so the container never ' +
      'turned healthy and this request would simply fail to connect. A green check ' +
      'here means the server process actually booted and is listening.',
  );

  const res = await step('GET /health', () => fetch(`${BASE_URL}/health`));

  await step('response is 200 with {status: "ok"}', async () => {
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { status: 'ok' });
  });
});

test('GET /api/health returns ok', async () => {
  await suite('Boot & health');
  await feature('Health check');
  await description(
    'Same boot check as /health, but through the `/api` prefix — this is the ' +
      'path the nginx proxy and the aio image\'s HEALTHCHECK actually use.',
  );

  const res = await step('GET /api/health', () => fetch(`${BASE_URL}/api/health`));

  await step('response is 200 with {status: "ok"}', async () => {
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { status: 'ok' });
  });
});

test('POST /api/applications/ without a token is rejected', async () => {
  await suite('Boot & health');
  await feature('Auth guard');
  await description(
    'Cheap smoke check that the JWT auth middleware is actually wired on a ' +
      'protected route, complementing the pure boot check above.',
  );

  const res = await step('POST /api/applications/ with no Authorization header', () =>
    fetch(`${BASE_URL}/api/applications/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }),
  );

  await step('response is 401', async () => {
    assert.equal(res.status, 401);
  });
});
