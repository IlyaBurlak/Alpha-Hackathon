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

/** Values of the backend `ApplicationType` enum (the goal of the loan). */
export const APPLICATION_TYPES = [
  'Пополнить оборотные средства',
  'транспорт',
  'спецтехника',
  'открыть новую точку',
  'рефинансировать кредиты',
  'другое',
] as const;

export const DEFAULT_APPLICATION_TYPE = 'другое';
export const DEFAULT_CONFIRM_REASON = 'Нужны средства для развития бизнеса';

export async function createApplication(
  token: string,
  body: { organizationId: number; sum: number; creditTime: CreditTimeInput; type?: string },
): Promise<Response> {
  return fetch(`${SERVER_BASE_URL}/api/applications/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ type: DEFAULT_APPLICATION_TYPE, ...body }),
  });
}

export async function confirmApplication(
  token: string,
  applicationId: number,
  productId: number,
  reason: string = DEFAULT_CONFIRM_REASON,
): Promise<Response> {
  return fetch(`${SERVER_BASE_URL}/api/applications/?applicationId=${applicationId}&productId=${productId}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify({ reason }),
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

export interface WaitOptions {
  timeoutMs?: number;
  intervalMs?: number;
}

export async function waitForScoreStatus(
  operatorToken: string,
  applicationId: number,
  status: string,
  options?: WaitOptions,
): Promise<void> {
  await waitFor(async () => {
    const body = await getApplicationScore(operatorToken, applicationId);
    return body?.applicationScore?.status === status;
  }, options);
}

export async function waitForScoreStatusChange(
  operatorToken: string,
  applicationId: number,
  fromStatus: string,
  options?: WaitOptions,
): Promise<void> {
  await waitFor(async () => {
    const body = await getApplicationScore(operatorToken, applicationId);
    return body?.applicationScore?.status !== undefined && body.applicationScore.status !== fromStatus;
  }, options);
}

export async function waitFor(check: () => Promise<boolean>, { timeoutMs = 10000, intervalMs = 300 }: WaitOptions = {}): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    if (await check()) return;
    if (Date.now() >= deadline) {
      throw new Error('waitFor: condition was not met within the timeout');
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

export async function createApplicationId(token: string, overrides: { organizationId?: number; sum?: number; creditTime?: CreditTimeInput; type?: string } = {}): Promise<number> {
  const res = await createApplication(token, {
    organizationId: overrides.organizationId ?? 1,
    sum: overrides.sum ?? 50000,
    creditTime: overrides.creditTime ?? { units: 'MONTH', value: 12 },
    type: overrides.type ?? DEFAULT_APPLICATION_TYPE,
  });
  if (res.status !== 200) {
    throw new Error(`createApplicationId failed with status ${res.status}`);
  }
  const body = await res.json();
  return body.id;
}

export async function createConfirmedApplicationId(
  userToken: string,
  operatorToken: string,
  productId = 2,
  options?: WaitOptions,
): Promise<number> {
  const id = await createApplicationId(userToken);

  const confirmRes = await confirmApplication(userToken, id, productId);
  if (confirmRes.status !== 200) {
    throw new Error(`createConfirmedApplicationId: confirm failed with status ${confirmRes.status}`);
  }

  await waitForScoreStatus(operatorToken, id, 'WAITONGOPERATOR', options);

  return id;
}
