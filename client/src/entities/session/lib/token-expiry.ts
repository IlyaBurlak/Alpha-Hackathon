import { decodeJwtPayload } from '@/shared/lib'

const MS_IN_SECOND = 1000

/** A token whose `exp` claim is in the past is no longer a session; a token without the claim is not judged. */
export function isTokenExpired(token: string, now: number = Date.now()): boolean {
  const exp = decodeJwtPayload(token)?.exp
  return typeof exp === 'number' && exp * MS_IN_SECOND <= now
}
