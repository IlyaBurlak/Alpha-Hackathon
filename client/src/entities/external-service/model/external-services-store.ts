import { makeAutoObservable, observableRef } from 'mobx'

import { getErrorMessage } from '@/shared/api'

import { fetchAvailability, updateAvailability } from '../api/service-availability'
import { EXTERNAL_SERVICE_IDS } from './types'
import type { ExternalServiceId, ServiceState } from './types'

const NOT_APPLIED_NOTICE = 'Сервис не подтвердил изменение: фактическое состояние осталось прежним.'

function createInitialStates(): Record<ExternalServiceId, ServiceState> {
  return { bank: { kind: 'loading' }, 'credit-bureau': { kind: 'loading' }, register: { kind: 'loading' } }
}

/** Availability of the external systems that the admin panel switches on and off. */
export class ExternalServicesStore {
  states: Record<ExternalServiceId, ServiceState> = createInitialStates()

  constructor() {
    makeAutoObservable(this, { states: observableRef })
  }

  get inactiveCount(): number {
    return EXTERNAL_SERVICE_IDS.filter((id) => {
      const state = this.states[id]
      return state.kind === 'ready' && state.availability === 'inactive'
    }).length
  }

  get activeCount(): number {
    return EXTERNAL_SERVICE_IDS.filter((id) => {
      const state = this.states[id]
      return state.kind === 'ready' && state.availability === 'active'
    }).length
  }

  get hasConnectionProblem(): boolean {
    return EXTERNAL_SERVICE_IDS.some((id) => this.states[id].kind === 'error')
  }

  async loadAll(): Promise<void> {
    await Promise.all(EXTERNAL_SERVICE_IDS.map((id) => this.load(id)))
  }

  async load(id: ExternalServiceId): Promise<void> {
    this.setState(id, { kind: 'loading' })
    try {
      const availability = await fetchAvailability(id)
      this.setState(id, { kind: 'ready', availability, isUpdating: false, notice: null })
    } catch (error) {
      this.setState(id, { kind: 'error', message: getErrorMessage(error) })
    }
  }

  async toggle(id: ExternalServiceId): Promise<void> {
    const state = this.states[id]
    if (state.kind !== 'ready' || state.isUpdating) return

    const requested = state.availability === 'active' ? 'inactive' : 'active'
    this.setState(id, { ...state, isUpdating: true, notice: null })
    try {
      await updateAvailability(id, requested === 'active')
      // Re-read the real state: the mock may accept the request without applying it.
      const availability = await fetchAvailability(id)
      const notice = availability === requested ? null : NOT_APPLIED_NOTICE
      this.setState(id, { kind: 'ready', availability, isUpdating: false, notice })
    } catch (error) {
      this.setState(id, { ...state, isUpdating: false, notice: getErrorMessage(error) })
    }
  }

  private setState(id: ExternalServiceId, state: ServiceState): void {
    this.states = { ...this.states, [id]: state }
  }
}
