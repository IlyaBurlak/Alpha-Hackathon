import { makeAutoObservable, observableRef } from 'mobx'

import { getErrorMessage } from './errors'

/** What a screen shows for loaded data: `Value` holds the fields of the `success` state (e.g. `{ user: User }`). */
export type ResourceState<Value extends object> =
  | { status: 'idle' }
  | { status: 'loading' }
  | ({ status: 'success' } & Value)
  | { status: 'error'; message: string }

/**
 * Loading state of one request: `idle -> loading -> success | error`. Stores keep their own `success` fields and
 * expose `resource.state`, so screens read it as before.
 */
export class AsyncResource<Value extends object> {
  state: ResourceState<Value> = { status: 'idle' }

  constructor() {
    makeAutoObservable(this, { state: observableRef })
  }

  /** Loads with a spinner: for the first load and for retries. */
  async load(request: () => Promise<Value>): Promise<void> {
    this.setState({ status: 'loading' })
    try {
      this.setState({ status: 'success', ...(await request()) })
    } catch (error) {
      this.setState({ status: 'error', message: getErrorMessage(error) })
    }
  }

  /**
   * Updates quietly, without a spinner. Returns the new value, or `null` when the request failed: the data on screen
   * is still valid then, so it is kept and no error is shown.
   */
  async refresh(request: () => Promise<Value>): Promise<Value | null> {
    try {
      const value = await request()
      this.setState({ status: 'success', ...value })
      return value
    } catch {
      return null
    }
  }

  /** Shows data that is already at hand, e.g. returned by an action. */
  set(value: Value): void {
    this.setState({ status: 'success', ...value })
  }

  reset(): void {
    this.setState({ status: 'idle' })
  }

  private setState(state: ResourceState<Value>): void {
    this.state = state
  }
}
