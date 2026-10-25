import { isRecord } from '@/shared/lib'

import { UnexpectedResponseError } from './errors'

/** Narrows an `unknown` payload to an object, or fails with the name of the part that was expected. */
export function readRecord(value: unknown, description: string): Record<string, unknown> {
  if (!isRecord(value)) throw new UnexpectedResponseError(`${description} is not an object`)
  return value
}

export function readArray(value: unknown, description: string): unknown[] {
  if (!Array.isArray(value)) throw new UnexpectedResponseError(`${description} is not a list`)
  return value
}

export function readString(source: Record<string, unknown>, key: string): string {
  const value = source[key]
  if (typeof value !== 'string') throw new UnexpectedResponseError(`"${key}" is not a string`)
  return value
}

export function readNumber(source: Record<string, unknown>, key: string): number {
  const value = source[key]
  if (typeof value !== 'number' || Number.isNaN(value)) throw new UnexpectedResponseError(`"${key}" is not a number`)
  return value
}

export function readBoolean(source: Record<string, unknown>, key: string): boolean {
  const value = source[key]
  if (typeof value !== 'boolean') throw new UnexpectedResponseError(`"${key}" is not a boolean`)
  return value
}

export function readDate(source: Record<string, unknown>, key: string): Date {
  const date = new Date(readString(source, key))
  if (Number.isNaN(date.getTime())) throw new UnexpectedResponseError(`"${key}" is not a date`)
  return date
}

/** A string that may be absent or `null`. */
export function readOptionalString(source: Record<string, unknown>, key: string): string | null {
  const value = source[key]
  if (value === undefined || value === null) return null
  return readString(source, key)
}

/** A number that may be absent or `null`. */
export function readOptionalNumber(source: Record<string, unknown>, key: string): number | null {
  const value = source[key]
  if (value === undefined || value === null) return null
  return readNumber(source, key)
}

/** A date that may be absent or `null`. */
export function readOptionalDate(source: Record<string, unknown>, key: string): Date | null {
  const value = source[key]
  if (value === undefined || value === null) return null
  return readDate(source, key)
}

/** Returns one of the allowed values, so that a union type can be built without a cast. */
export function readOneOf<Value extends string>(
  source: Record<string, unknown>,
  key: string,
  allowed: readonly Value[],
): Value {
  const value = readString(source, key)
  const match = allowed.find((option) => option === value)
  if (match === undefined) throw new UnexpectedResponseError(`"${key}" has an unknown value "${value}"`)
  return match
}
