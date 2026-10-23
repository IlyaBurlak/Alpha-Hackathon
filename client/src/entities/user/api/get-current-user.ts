import { httpClient } from '@/shared/api'

import type { User } from '../model/types'
import { mapUser } from './user-mapper'

const CURRENT_USER_PATH = '/users/info'

export async function getCurrentUser(): Promise<User> {
  return mapUser(await httpClient.get(CURRENT_USER_PATH))
}
