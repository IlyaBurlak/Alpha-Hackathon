import { ApplicationListStore } from '@/entities/application'
import { ExternalServicesStore } from '@/entities/external-service'
import { SessionStore } from '@/entities/session'
import { UserStore } from '@/entities/user'
import { httpClient } from '@/shared/api'

export class RootStore {
  readonly session = new SessionStore()
  readonly user = new UserStore()
  readonly applications = new ApplicationListStore()
  readonly externalServices = new ExternalServicesStore()

  start(): () => void {
    const removeUnauthorizedHandler = httpClient.setUnauthorizedHandler(() => {
      this.session.signOut()
      this.user.reset()
      this.applications.reset()
    })

    if (this.session.isAuthenticated) void this.user.load()

    return removeUnauthorizedHandler
  }
}
