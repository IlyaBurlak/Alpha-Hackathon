export const NETWORK_ERROR_STATUS = 0

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export class UnexpectedResponseError extends Error {
  constructor(description: string) {
    super(`Unexpected response: ${description}`)
    this.name = 'UnexpectedResponseError'
  }
}

const FALLBACK_ERROR_MESSAGE = 'Что-то пошло не так. Попробуйте ещё раз.'

export function getErrorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : FALLBACK_ERROR_MESSAGE
}
