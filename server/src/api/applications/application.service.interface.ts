import { ApplicationEntity, ApplicationStatus } from "./entity/application.entity";
import { OperatorSolution } from "./entity/operator.solution";


export interface IApplicationService {
  createApplication(application: ApplicationEntity ): Promise<ApplicationEntity>
  getApplicationById(id: number, userId: number): Promise<ApplicationEntity>;
  getApplicationByUserId(userId: number): Promise<ApplicationEntity[]>;
  confirmApplication(applicationId: number, userId: number, productId: number): Promise<ApplicationEntity>;
  restartScoring(applicationId: number): Promise<void>;
  getApplicationWithScore(id: number): Promise<ApplicationEntity>;
  saveOperatorSolution(applicationId: number, solution: OperatorSolution, operatorId: number): Promise<void>;
  getAllApplicationsForOperator(): Promise<ApplicationEntity[]>;
  takeApplicationForOperator(applicationId: number, operatorId: number): Promise<void>;
  acceptSpecialProduct(applicationId: number, status: ApplicationStatus, userId: number): Promise<void>
}