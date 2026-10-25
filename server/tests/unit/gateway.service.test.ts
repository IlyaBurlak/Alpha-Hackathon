import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { GatewayService } from '../../src/api/gateway/gateway.service';
import { OrganizationType } from '../../src/api/organizations/entity/organization.entity';

type Handler = (req: http.IncomingMessage, res: http.ServerResponse) => void;

let server: http.Server;
let lastRequestPath: string | undefined;
let handler: Handler = (_req, res) => {
  res.statusCode = 404;
  res.end();
};

before(async () => {
  server = http.createServer((req, res) => {
    lastRequestPath = req.url;
    handler(req, res);
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const { port } = server.address() as { port: number };
  const baseUrl = `http://127.0.0.1:${port}`;
  process.env.BANK_API = `${baseUrl}/api/banks`;
  process.env.CREDIT_BUREAU_API = `${baseUrl}/api/credit-bureaus`;
  process.env.REGISTER_API = `${baseUrl}/api/register`;
  process.env.ML_SCORING_API = `${baseUrl}/`;
});

after(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

beforeEach(() => {
  lastRequestPath = undefined;
  handler = (_req, res) => {
    res.statusCode = 404;
    res.end();
  };
});

function respondJson(status: number, body: unknown): void {
  handler = (_req, res) => {
    res.statusCode = status;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(body));
  };
}

function respondBroken(): void {
  handler = (req) => {
    req.socket.destroy();
  };
}

test('getBanksProducts returns the array from a 200 response', async () => {
  respondJson(200, [{ id: 1 }]);

  const result = await new GatewayService().getBanksProducts();

  assert.deepEqual(result, [{ id: 1 }]);
});

test('getBanksProducts returns an empty array on a non-200 response', async () => {
  respondJson(201, []);

  const result = await new GatewayService().getBanksProducts();

  assert.deepEqual(result, []);
});

test('getBanksProducts returns an empty array when the response body is not an array', async () => {
  respondJson(200, { error: 'unexpected' });

  const result = await new GatewayService().getBanksProducts();

  assert.deepEqual(result, []);
});

test('getBanksProducts returns undefined when the request fails', async () => {
  respondBroken();

  const result = await new GatewayService().getBanksProducts();

  assert.equal(result, undefined);
});

test('getCreditBureauHistory returns the response body on success', async () => {
  respondJson(200, { bankrupt: false });

  const result = await new GatewayService().getCreditBureauHistory('7701234568');

  assert.deepEqual(result, { bankrupt: false });
});

test('getCreditBureauHistory returns undefined when the request fails', async () => {
  respondBroken();

  const result = await new GatewayService().getCreditBureauHistory('7701234568');

  assert.equal(result, undefined);
});

test('getRegisterInfo calls the legal-entity endpoint for OO organizations', async () => {
  respondJson(200, { isActive: true });

  await new GatewayService().getRegisterInfo('7701234568', OrganizationType.OO);

  assert.match(lastRequestPath as string, /\/legal\?inn=7701234568$/);
});

test('getRegisterInfo calls the individual endpoint for sole proprietors', async () => {
  respondJson(200, { isActive: true });

  await new GatewayService().getRegisterInfo('2301234560', OrganizationType.IndividualEntrepreneur);

  assert.match(lastRequestPath as string, /\/individual\?inn=2301234560$/);
});

test('getRegisterInfo returns undefined when the request fails', async () => {
  respondBroken();

  const result = await new GatewayService().getRegisterInfo('7701234568', OrganizationType.OO);

  assert.equal(result, undefined);
});

test('getMlScoring returns the response body on success', async () => {
  respondJson(200, { score: 0.1 });

  const result = await new GatewayService().getMlScoring({ id: 1 } as any);

  assert.deepEqual(result, { score: 0.1 });
});

test('getMlScoring returns undefined when the request fails', async () => {
  respondBroken();

  const result = await new GatewayService().getMlScoring({ id: 1 } as any);

  assert.equal(result, undefined);
});
