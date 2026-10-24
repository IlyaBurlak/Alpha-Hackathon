import { ApplicationEntity } from "./entity/application.entity";
import { OperatorSolution } from "./entity/operator.solution";


export interface IApplicationService {
  createApplication(application: ApplicationEntity ): Promise<ApplicationEntity>
  getApplicationById(id: number, userId: number): Promise<ApplicationEntity>;
  getApplicationByUserId(userId: number): Promise<ApplicationEntity[]>;
  confirmApplication(applicationId: number, userId: number, productId: number): Promise<ApplicationEntity>;
  restartScoring(applicationId: number): Promise<void>;
  getApplicationWithScore(id: number): Promise<ApplicationEntity>;
  saveOperatorSolution(applicationId: number, solution: OperatorSolution): Promise<void>;
}