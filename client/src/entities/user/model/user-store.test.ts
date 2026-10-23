import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getCurrentUser } from '../api/get-current-user'
import type { User } from './types'
import { UserStore } from './user-store'

vi.mock('../api/get-current-user')

const USER: User = {
  id: 1,
  login: 'alfaTest',
  fullName: 'Тестов Тест',
  organizations: [
    { id: 2, inn: '5001234569', name: 'ООО "Кот не знает"', type: 'legal-entity' },
    { id: 6, inn: '5401234563', name: 'ИП Динозавриков Сергей', type: 'sole-proprietor' },
  ],
}

beforeEach(() => {
  vi.mocked(getCurrentUser).mockReset()
})

describe('UserStore: selected organization', () => {
  it('has none until the user is loaded', () => {
    expect(new UserStore().selectedOrganization).toBeNull()
  })

  it('defaults to the first organization of the user', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USER)
    const store = new UserStore()

    await store.load()

    expect(store.selectedOrganization?.id).toBe(2)
  })

  it('switches to the chosen organization', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USER)
    const store = new UserStore()
    await store.load()

    store.selectOrganization(6)

    expect(store.selectedOrganization?.id).toBe(6)
  })

  it('is null for a user without organizations', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ ...USER, organizations: [] })
    const store = new UserStore()

    await store.load()

    expect(store.selectedOrganization).toBeNull()
  })
})
