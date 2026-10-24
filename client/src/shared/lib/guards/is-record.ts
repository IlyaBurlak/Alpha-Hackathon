/** Narrows `unknown` to a plain object so API payloads can be validated without `any`. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
