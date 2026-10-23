import { UnexpectedResponseError, httpClient } from '@/shared/api'
import { isRecord } from '@/shared/lib'

const LOGIN_PATH = '/users/login'

export interface Credentials {
  login: string
  password: string
}

export async function requestToken(credentials: Credentials): Promise<string> {
  const payload = await httpClient.post(LOGIN_PATH, credentials)
  if (!isRecord(payload) || typeof payload.token !== 'string') {
    throw new UnexpectedResponseError('login payload has no token')
  }
  return payload.token
}
