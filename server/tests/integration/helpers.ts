export const SERVER_BASE_URL = process.env.SERVER_BASE_URL ?? 'http://localhost:3001';
export const EXTERNAL_SYSTEMS_BASE_URL = process.env.EXTERNAL_SYSTEMS_BASE_URL ?? 'http://localhost:5006';

export async function login(loginName: string, password: string): Promise<string> {
  const res = await fetch(`${SERVER_BASE_URL}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login: loginName, password }),
  });
  if (res.status !== 200) {
    throw new Error(`login('${loginName}') failed with status ${res.status}`);
  }
  const body = await res.json();
  return body.token;
}

export async function loginOperator(loginName: string, password: string): Promise<string> {
  const res = await fetch(`${SERVER_BASE_URL}/api/users/admin-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login: loginName, password }),
  });
  if (res.status !== 200) {
    throw new Error(`loginOperator('${loginName}') failed with status ${res.status}`);
  }
  const body = await res.json();
  return body.token;
}

export function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export interface CreditTimeInput {
  units: 'DAY' | 'MONTH' | 'YEAR';
  value: number;
}

export async function createApplication(
  token: string,
  body: { organizationId: number; sum: number; creditTime: CreditTimeInput },
): Promise<Response> {
  return fetch(`${SERVER_BASE_URL}/api/applications/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
}

export async function confirmApplication(token: string, applicationId: number, productId: number): Promise<Response> {
  return fetch(`${SERVER_BASE_URL}/api/applications/?applicationId=${applicationId}&productId=${productId}`, {
    method: 'PUT',
    headers: authHeaders(token),
  });
}

export async function getApplicationById(token: string, applicationId: number): Promise<Response> {
  return fetch(`${SERVER_BASE_URL}/api/applications/${applicationId}`, {
    method: 'GET',
    headers: authHeaders(token),
  });
}

type MockService = 'banks' | 'credit-bureaus' | 'register';

export async function setMockActive(service: MockService, isActive: boolean): Promise<void> {
  const res = await fetch(`${EXTERNAL_SYSTEMS_BASE_URL}/api/${service}/setActive`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isActive }),
  });
  if (res.status !== 200) {
    throw new Error(`setMockActive('${service}', ${isActive}) failed with status ${res.status}`);
  }
}

export async function getApplicationScore(operatorToken: string, applicationId: number): Promise<any | null> {
  const res = await fetch(`${SERVER_BASE_URL}/api/applications/${applicationId}/score`, { headers: authHeaders(operatorToken) });
  if (res.status !== 200) return null;
  return res.json();
}

export async function waitForScoreStatus(operatorToken: string, applicationId: number, status: string): Promise<void> {
  await waitFor(async () => {
    const body = await getApplicationScore(operatorToken, applicationId);
    return body?.applicationScore?.status === status;
  });
}

export async function waitFor(
  check: () => Promise<boolean>,
  { timeoutMs = 10000, intervalMs = 300 }: { timeoutMs?: number; intervalMs?: number } = {},
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    if (await check()) return;
    if (Date.now() >= deadline) {
      throw new Error('waitFor: condition was not met within the timeout');
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}
