import { ExternalServicesStore } from '@/entities/external-service'
import { SessionStore } from '@/entities/session'
import { UserStore } from '@/entities/user'
import { httpClient } from '@/shared/api'

export class RootStore {
  readonly session = new SessionStore()
  readonly user = new UserStore()
  readonly externalServices = new ExternalServicesStore()

  start(): () => void {
    const removeUnauthorizedHandler = httpClient.setUnauthorizedHandler(() => {
      this.session.signOut()
      this.user.reset()
    })

    if (this.session.isAuthenticated) void this.user.load()

    return removeUnauthorizedHandler
  }
}
