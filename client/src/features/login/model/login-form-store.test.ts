import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { SessionStore } from '@/entities/session'
import type { UserStore } from '@/entities/user'
import { ApiError } from '@/shared/api'

import { LoginFormStore } from './login-form-store'

vi.mock('@/entities/session', () => ({
  requestToken: vi.fn(),
}))

const { requestToken } = await import('@/entities/session')

function buildStore() {
  const session = { signIn: vi.fn() } as unknown as SessionStore
  const user = { load: vi.fn().mockResolvedValue(undefined) } as unknown as UserStore
  return { store: new LoginFormStore(session, user), session, user }
}

beforeEach(() => {
  vi.mocked(requestToken).mockReset()
})

describe('LoginFormStore: validation', () => {
  it('cannot submit until both login and password are filled', () => {
    const { store } = buildStore()

    expect(store.canSubmit).toBe(false)
    store.setLogin('alfaTest')
    expect(store.canSubmit).toBe(false)
    store.setPassword('alfaTest!')
    expect(store.canSubmit).toBe(true)
  })

  it('cannot submit when the login is only whitespace', () => {
    const { store } = buildStore()
    store.setLogin('   ')
    store.setPassword('alfaTest!')

    expect(store.canSubmit).toBe(false)
  })
})

describe('LoginFormStore: submit', () => {
  it('signs in and loads the user on success', async () => {
    vi.mocked(requestToken).mockResolvedValue('jwt-token')
    const { store, session, user } = buildStore()
    store.setLogin('alfaTest')
    store.setPassword('alfaTest!')

    await store.submit()

    expect(requestToken).toHaveBeenCalledWith({ login: 'alfaTest', password: 'alfaTest!' })
    expect(session.signIn).toHaveBeenCalledWith('jwt-token')
    expect(user.load).toHaveBeenCalled()
    expect(store.isSubmitting).toBe(false)
    expect(store.errorMessage).toBeNull()
  })

  it('trims the login before sending it', async () => {
    vi.mocked(requestToken).mockResolvedValue('jwt-token')
    const { store } = buildStore()
    store.setLogin('  alfaTest  ')
    store.setPassword('alfaTest!')

    await store.submit()

    expect(requestToken).toHaveBeenCalledWith({ login: 'alfaTest', password: 'alfaTest!' })
  })

  it('exposes the error message and does not sign in on failure', async () => {
    vi.mocked(requestToken).mockRejectedValue(new ApiError(401, 'Неверный логин или пароль'))
    const { store, session } = buildStore()
    store.setLogin('alfaTest')
    store.setPassword('wrong')

    await store.submit()

    expect(store.errorMessage).toBe('Неверный логин или пароль')
    expect(store.isSubmitting).toBe(false)
    expect(session.signIn).not.toHaveBeenCalled()
  })

  it('does not call the backend when the form is invalid', async () => {
    const { store } = buildStore()

    await store.submit()

    expect(requestToken).not.toHaveBeenCalled()
  })
})
