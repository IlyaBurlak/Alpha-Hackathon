import { beforeEach, describe, expect, it, vi } from 'vitest'

import { EmployeeStore } from '@/entities/employee'
import { SessionStore, requestEmployeeToken } from '@/entities/session'
import { ApiError } from '@/shared/api'

import { StaffLoginFormStore } from './staff-login-form-store'

vi.mock('@/entities/session', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/entities/session')>()),
  requestEmployeeToken: vi.fn(),
}))

class MemoryStorage {
  private readonly values = new Map<string, string>()

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }

  removeItem(key: string): void {
    this.values.delete(key)
  }
}

function createToken(claims: unknown): string {
  return `h.${btoa(JSON.stringify(claims)).replace(/=+$/, '')}.s`
}

function createForm() {
  const session = new SessionStore()
  const employee = new EmployeeStore()
  return { form: new StaffLoginFormStore(session, employee), session, employee }
}

beforeEach(() => {
  vi.mocked(requestEmployeeToken).mockReset()
  Object.defineProperty(globalThis, 'localStorage', { value: new MemoryStorage(), configurable: true })
  Object.defineProperty(globalThis, 'sessionStorage', { value: new MemoryStorage(), configurable: true })
})

describe('StaffLoginFormStore', () => {
  it('asks for a login and a password and marks the empty fields', async () => {
    const { form } = createForm()
    form.setLogin('ivanova')

    expect(await form.submit()).toBe(false)

    expect(form.errorMessage).toBe('Введите логин и пароль')
    expect(form.invalidFields).toEqual(['password'])
    expect(requestEmployeeToken).not.toHaveBeenCalled()
  })

  it('signs the employee in and remembers who it is', async () => {
    vi.mocked(requestEmployeeToken).mockResolvedValue(createToken({ login: 'alfaOperator1', isAdmin: true }))
    const { form, session, employee } = createForm()
    form.setLogin(' alfaOperator1 ')
    form.setPassword('alfaOperator1!')

    expect(await form.submit()).toBe(true)

    expect(requestEmployeeToken).toHaveBeenCalledWith({ login: 'alfaOperator1', password: 'alfaOperator1!' })
    expect(session.claims).toEqual({ login: 'alfaOperator1', role: 'employee' })
    expect(employee.current?.name).toBe('Антон Кошмариков')
    expect(form.errorMessage).toBeNull()
  })

  it('keeps the session only for the tab when "remember me" is off', async () => {
    vi.mocked(requestEmployeeToken).mockResolvedValue(createToken({ login: 'kim', isAdmin: true }))
    const { form } = createForm()
    form.setLogin('kim')
    form.setPassword('demo2026')
    form.setRemembered(false)

    await form.submit()

    expect(localStorage.getItem('auth-token')).toBeNull()
    expect(sessionStorage.getItem('auth-token')).not.toBeNull()
  })

  it('shows the message of the backend and marks the password', async () => {
    vi.mocked(requestEmployeeToken).mockRejectedValue(new ApiError(500, 'Неверный логин или пароль'))
    const { form, session } = createForm()
    form.setLogin('ivanova')
    form.setPassword('wrong')

    expect(await form.submit()).toBe(false)

    expect(form.errorMessage).toBe('Неверный логин или пароль')
    expect(form.invalidFields).toEqual(['password'])
    expect(session.isAuthenticated).toBe(false)
    expect(form.isSubmitting).toBe(false)
  })

  it('does not let a token of an entrepreneur into the staff cabinet', async () => {
    vi.mocked(requestEmployeeToken).mockResolvedValue(createToken({ login: 'alfaSergey', id: 5 }))
    const { form, session } = createForm()
    form.setLogin('alfaSergey')
    form.setPassword('x')

    expect(await form.submit()).toBe(false)

    expect(session.isAuthenticated).toBe(false)
    expect(form.errorMessage).toBe('Этот аккаунт не относится к сотрудникам банка')
  })
})
