import { isRecord } from '../guards/is-record'

const PAYLOAD_PART_INDEX = 1
const BASE64_URL_REPLACEMENTS: ReadonlyArray<readonly [RegExp, string]> = [
  [/-/g, '+'],
  [/_/g, '/'],
]

/**
 * Reads the claims of a JWT without verifying it: the client only needs them to pick the right cabinet,
 * the server checks the signature on every request.
 */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const payload = token.split('.')[PAYLOAD_PART_INDEX]
  if (!payload) return null
  try {
    const base64 = BASE64_URL_REPLACEMENTS.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), payload)
    const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))
    const claims: unknown = JSON.parse(new TextDecoder().decode(bytes))
    return isRecord(claims) ? claims : null
  } catch {
    return null
  }
}
