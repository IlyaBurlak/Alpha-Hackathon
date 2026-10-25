import { ApplicationEntity, ApplicationStatus, CreditTimeUnits } from '../../../src/api/applications/entity/application.entity';

export function buildApplication(overrides: Record<string, unknown> = {}): ApplicationEntity {
  return new ApplicationEntity({
    id: 1,
    userId: 1,
    organizationId: 1,
    sum: 50000,
    status: ApplicationStatus.DRAFT,
    createdAt: new Date(),
    creditTimeUnits: CreditTimeUnits.MONTH,
    creditValue: 12,
    loanIssuanceDate: new Date(),
    ...overrides,
  });
}
