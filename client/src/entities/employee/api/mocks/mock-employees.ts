/**
 * MOCK: the backend has no directory of bank employees (docs/backend-requirements.md, staff cabinet).
 * The first three are the employees of the design, the last two are the operators of the seeded database.
 */
import type { Employee } from '../../model/types'

export const MOCK_EMPLOYEES: readonly Employee[] = [
  { id: 'u1', login: 'ivanova', name: 'Мария Иванова', initials: 'МИ', position: 'Кредитный аналитик' },
  { id: 'u2', login: 'orlov', name: 'Дмитрий Орлов', initials: 'ДО', position: 'Кредитный аналитик' },
  { id: 'u3', login: 'kim', name: 'Елена Ким', initials: 'ЕК', position: 'Руководитель группы' },
  { id: 'op1', login: 'alfaoperator1', name: 'Антон Кошмариков', initials: 'АК', position: 'Кредитный аналитик' },
  { id: 'op2', login: 'alfaoperator2', name: 'Владислав Супов', initials: 'ВС', position: 'Кредитный аналитик' },
]
