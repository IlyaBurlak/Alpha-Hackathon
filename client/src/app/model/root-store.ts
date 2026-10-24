import { ApplicationListStore } from '@/entities/application'
import { EmployeeStore } from '@/entities/employee'
import { ExternalServicesStore } from '@/entities/external-service'
import { SessionStore, USER_ROLES } from '@/entities/session'
import { QueueViewStore, StaffApplicationListStore } from '@/entities/staff-application'
import { UserStore } from '@/entities/user'
import { httpClient } from '@/shared/api'

export class RootStore {
  readonly session = new SessionStore()
  readonly user = new UserStore()
  readonly applications = new ApplicationListStore()
  readonly employee = new EmployeeStore()
  readonly staffApplications = new StaffApplicationListStore()
  readonly queueView = new QueueViewStore()
  readonly externalServices = new ExternalServicesStore()

  constructor() {
    const { claims } = this.session
    if (claims?.role === USER_ROLES.employee) this.employee.setLogin(claims.login)
  }

  start(): () => void {
    const removeUnauthorizedHandler = httpClient.setUnauthorizedHandler(() => {
      this.signOutEverywhere()
    })

    if (this.session.claims?.role === USER_ROLES.entrepreneur) void this.user.load()

    return removeUnauthorizedHandler
  }

  private signOutEverywhere(): void {
    this.session.signOut()
    this.user.reset()
    this.applications.reset()
    this.employee.setLogin(null)
    this.staffApplications.reset()
  }
}
