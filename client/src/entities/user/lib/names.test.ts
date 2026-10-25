import { describe, expect, it } from 'vitest'

import { getFirstName, getOrganizationInitials, getPersonInitials } from './names'

describe('getOrganizationInitials', () => {
  it.each([
    ['ООО "Кот не знает"', 'КН'],
    ['ООО "Ромашка"', 'РО'],
    ['ИП Сырный Иван', 'СИ'],
    ['ООО «Колос и Ко»', 'КК'],
  ])('takes initials of %s', (name, expected) => {
    expect(getOrganizationInitials(name)).toBe(expected)
  })
})

describe('getPersonInitials', () => {
  it('takes the first letters of the first two words', () => {
    expect(getPersonInitials('Бурлак Илья')).toBe('БИ')
    expect(getPersonInitials('Иванов Иван Иванович')).toBe('ИИ')
  })
})

describe('getFirstName', () => {
  it('takes the second word of "Surname Name"', () => {
    expect(getFirstName('Бурлак Илья')).toBe('Илья')
  })

  it('falls back to the only word', () => {
    expect(getFirstName('Админ')).toBe('Админ')
  })
})
